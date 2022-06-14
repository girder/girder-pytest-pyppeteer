type XPath = string;
type Predicate = string;
type Strings = string | Strings[] | undefined;

const xpathRegex = /\/\/[a-z*]+(\[.*\])*/;

function isXPath(text: string): boolean {
  return xpathRegex.test(text);
}

/**
 * Formats an argument into one or more XPath predicates.
 * If the argument is a valid XPath, then the predicate will match all elements that contain the
 * element identified by that XPath.
 * If the argument is any other string, then the predicate will match all elements that contain
 * that string in their text bodies.
 * If the argument is an array, the function is called recursively and multiple predicates are
 * returned in the same string.
 *
 * @param content the content of the element to form a predicate for
 */
function contentAsPredicate(content?: Strings): Predicate {
  if (Array.isArray(content)) {
    return content.map((c) => contentAsPredicate(c)).join('');
  }
  if (typeof content === 'string') {
    if (isXPath(content)) {
      return `[.${content}]`;
    }
    return `[contains(.,"${content}")]`;
  }
  return '';
}

/**
 * Formats a list of CSS classes into XPath predicates.
 *
 * @param classes the CSS classes to form a predicate for
 */
function classAsPredicate(...classes: Strings[]): Predicate {
  return classes.map((cssClass) => {
    if (Array.isArray(cssClass)) {
      return cssClass.map((c) => classAsPredicate(c)).join('');
    }
    if (typeof cssClass === 'string') {
      return `[contains(concat(" ",@class," "), " ${cssClass} ")]`;
    }
    return '';
  }).join('');
}

/**
 * Formats an element of a component as a XPath predicate.
 * Vuetify components will generally have this structure for sub-elements,
 * so this helper saves a lot of boilerplate.
 * For example:
 * <v-foo>
 *   <div class="v-foo__title" ... />
 *   <div class="v-foo__contents" ... />
 * </v-foo>
 *
 * @param name the name of the Vuetify component
 * @param element the name of the element
 * @param value the contents of the element
 */
function elementAsPredicate(name: string, element: string, value: Strings): Predicate {
  const className = `${name}__${element}`;
  return (value) ? `[.//*${classAsPredicate(className)}${contentAsPredicate(value)}]` : '';
}

/**
 * Formats a list of elements of a component as a XPath predicate.
 * This is a wrapper for elementAsPredicate that handles multiple elements.
 *
 * @param name the name of the Vuetify component
 * @param values the contents of each element
 */
function elementsAsPredicate<T extends { [key: string]: Strings }>(
  name: string,
  values: T,
): Predicate {
  return Object.keys(values).map((key) => elementAsPredicate(name, key, values[key])).join('');
}

/**
 * Generates a predicate for a togglable value (tile, disabled, etc.).
 * If the `toggleValue` is undefined, an empty string is returned.
 * If true, `trueExpression` is returned as a predicate.
 * IF false, `falseExpression` is returned as a predicate.
 *
 * @param toggleValue the toggle value to be tested.
 * @param trueExpression the expected expression to use if toggleValue is true.
 * @param falseExpression the expected expression to use if toggleValue is false.
 */
function togglePredicate(
  toggleValue: boolean | undefined,
  trueExpression: string,
  falseExpression: string,
): Predicate {
  if (toggleValue === undefined) {
    return '';
  }
  if (toggleValue) {
    return `[${trueExpression}]`;
  }
  return `[${falseExpression}]`;
}

/**
 * Parses the argument to a wrapped vElement function.
 * If the argument is an object, it is passed directly to the wrapped function as destructured
 * arguments.
 * Otherwise, the argument is wrapped in an object, keyed by a default parameter.
 *
 * For this example function definition:
 *
 * function _vFoo({content, cssClass}) { ... }
 * const vFoo = defaultParam(_vFoo, 'content')
 *
 * This wrapper allows calls like this to be mapped like so:
 *
 * vFoo() => vFoo({})
 * vFoo('abc') => vFoo({content: 'abc'})
 * vFoo(['abc', 'xyz']) => vFoo({content: ['abc, 'xyz']})
 * vFoo({cssClass: 'test'}) => vFoo({cssClass: 'test'}) // no change
 *
 * @param vFunction the XPath generator function to wrap
 * @param param the name of the default parameter to use
 */
function defaultParam<T>(
  vFunction: (args: T) => XPath,
  param: keyof T,
) {
  return (args?: T | Strings): XPath => {
    if (typeof args === 'object' && !Array.isArray(args)) {
      return vFunction(args);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ret: any = {};
    ret[param] = args;
    return vFunction(ret);
  };
}


function _vAvatar({ content, cssClass }: { content?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-avatar', cssClass)}${contentAsPredicate(content)}`;
}
const vAvatar = defaultParam(_vAvatar, 'content');

function _vBtn({
  content,
  cssClass,
  disabled,
}: {
  content?: Strings,
  cssClass?: Strings,
  disabled?: boolean
}): XPath {
  const disabledPredicate = togglePredicate(disabled, '@disabled="disabled"', 'not(@disabled)');
  return `//*${classAsPredicate('v-btn', cssClass)}${contentAsPredicate(content)}${disabledPredicate}`;
}
const vBtn = defaultParam(_vBtn, 'content');

function _vCard({
  content,
  cssClass,
  title,
  subtitle,
  text,
  actions,
}: {
  content?: Strings,
  cssClass?: Strings,
  title?: Strings,
  subtitle?: Strings,
  text?: Strings,
  actions?: Strings
}): XPath {
  return `//*${classAsPredicate('v-card', cssClass)}${elementsAsPredicate('v-card', {
    title, subtitle, text, actions,
  })}${contentAsPredicate(content)}`;
}
const vCard = defaultParam(_vCard, 'content');

function _vChip({ content, cssClass }: { content?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-chip', cssClass)}[*[@class="v-chip__content"]${contentAsPredicate(content)}]`;
}
const vChip = defaultParam(_vChip, 'content');

function _vIcon({ icon, cssClass }: { icon?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-icon', icon, cssClass)}`;
}
const vIcon = defaultParam(_vIcon, 'icon');

function _vImg({ src, cssClass }: { src?: Strings, cssClass?: Strings }): XPath {
  // v-img embeds the src into a background-image css style:
  // <div style="background-image: url("http://localhost:8080/harold.png");">
  // To account for relative paths, we search the style tag for the URL, plus the next 3 characters
  const srcPredicate = (src) ? `[*${classAsPredicate('v-image__image')}[contains(@style, '${src}");')]]` : '';
  return `//*${classAsPredicate('v-image', cssClass)}${srcPredicate}`;
}
const vImg = defaultParam(_vImg, 'src');

function _vList({ content, cssClass }: {content?: Strings, cssClass?: Strings}) {
  return `//*${classAsPredicate('v-list', cssClass)}${contentAsPredicate(content)}`;
}
const vList = defaultParam(_vList, 'content');

function _vListItem({
  content,
  cssClass,
  title,
  subtitle,
  action,
  avatar,
  icon,
}: {
  content?: Strings,
  cssClass?: Strings,
  title?: Strings,
  subtitle?: Strings,
  action?: Strings,
  avatar?: Strings,
  icon?: Strings,
}): XPath {
  return `//*${classAsPredicate('v-list-item', cssClass)}${elementsAsPredicate('v-list-item', {
    content, title, subtitle, action, avatar, icon,
  })}`;
}
const vListItem = defaultParam(_vListItem, 'content');

function _vListItemTitle({ content, cssClass }: { content?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-list-item__title', cssClass)}${contentAsPredicate(content)}`;
}
const vListItemTitle = defaultParam(_vListItemTitle, 'content');

function _vListItemSubtitle({
  content,
  cssClass,
}: {
  content?: Strings,
  cssClass?: Strings
}): XPath {
  return `//*${classAsPredicate('v-list-item__subtitle', cssClass)}${contentAsPredicate(content)}`;
}
const vListItemSubtitle = defaultParam(_vListItemSubtitle, 'content');

function _vListItemAction({ content, cssClass }: { content?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-list-item__action', cssClass)}${contentAsPredicate(content)}`;
}
const vListItemAction = defaultParam(_vListItemAction, 'content');

function _vListItemAvatar({ content, cssClass }: { content?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-list-item__avatar', cssClass)}${contentAsPredicate(content)}`;
}
const vListItemAvatar = defaultParam(_vListItemAvatar, 'content');

function _vListItemIcon({ content, cssClass }: { content?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-list-item__icon', cssClass)}${contentAsPredicate(content)}`;
}
const vListItemIcon = defaultParam(_vListItemIcon, 'content');

function _vListItemGroup({
  header,
  items,
  cssClass,
}: {
  header?: Strings,
  items?: Strings,
  cssClass?: Strings
}): XPath {
  return `//*${classAsPredicate('v-list-item-group', cssClass)}${elementsAsPredicate('v-list-group', { header, items })}`;
}
const vListItemGroup = defaultParam(_vListItemGroup, 'items');

/* TODO this is a Vuetify 1.5 component */
function _vListTile({
  content,
  cssClass,
  title,
  subtitle,
  action,
  avatar,
}: {
  content?: Strings,
  cssClass?: Strings,
  title?: Strings,
  subtitle?: Strings,
  action?: Strings,
  avatar?: Strings,
}): XPath {
  return `//*${classAsPredicate('v-list__tile', cssClass)}${elementsAsPredicate('v-list__tile', {
    content, title, 'sub-title': subtitle, action, avatar,
  })}`;
}
const vListTile = defaultParam(_vListTile, 'content');

function _vTextarea({ label, cssClass }: { label?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-textarea', cssClass)}//*[label[contains(text(),"${label}")]]//textarea`;
}
const vTextarea = defaultParam(_vTextarea, 'label');

function _vTextField({ label, cssClass }: { label?: Strings, cssClass?: Strings }): XPath {
  const labelPredicate = (label) ? `[.//*[label[contains(text(),"${label}")]]]` : '';
  return `//*${classAsPredicate('v-text-field', cssClass)}${labelPredicate}//input`;
}
const vTextField = defaultParam(_vTextField, 'label');

function _vToolbar({ content, cssClass }: { content?: Strings, cssClass?: Strings }): XPath {
  return `//*${classAsPredicate('v-toolbar', cssClass)}[*[@class="v-toolbar__content"]${contentAsPredicate(content)}]`;
}
const vToolbar = defaultParam(_vToolbar, 'content');
