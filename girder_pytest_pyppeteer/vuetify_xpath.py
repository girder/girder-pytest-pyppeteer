from __future__ import annotations

from json import JSONEncoder

# Pyppeteer uses json.JSONEncoder to send any arguments to the Puppeteer API.
# We do this monkeypatching so that we can send raw XPath arguments directly.
# Any object with a __to_json__ method will be encodeable by pyppeteer.

# Monkey patch the JSONEncoder method which handles unsupported data types
def _default(self, obj):
    return getattr(obj.__class__, "__to_json__", _default.default)(obj)


_default.default = JSONEncoder.default  # Save unmodified default.
JSONEncoder.default = _default  # Replace it.


class XPath:
    def __init__(self, xpath='*'):
        self._xpath = xpath
    
    @property
    def bare(self):
        return self._xpath
    
    @property
    def recursive(self):
        # Search the entire document recursively for this XPath
        return f'//{self._xpath}'
    
    @property
    def local(self):
        # Search a given element for this XPath
        return f'./{self._xpath}'

    def __str__(self):
        return self.recursive
    
    def __to_json__(self):
        return str(self)
    
    def extend(self, extension: str):
        return XPath(f'{self.bare}{extension}')
    
    def predicate(self, predicate: str):
        return self.extend(f'[{predicate}]')

    def __truediv__(self, other: XPath):
        return self.extend(f'/{other.bare}')

    def __floordiv__(self, other: XPath):
        return self.extend(f'//{other.bare}')
    
    def __getitem__(self, key: XPath):
        return self.predicate(key.bare)
    
    @property
    def parent(self):
        return self / '..'
    
    def with_class(self, clazz: str):
        # This magic ensures that calling with_class('v-btn') doesn't match the class 'v-btn__extra'
        return self.predicate(f'contains(concat(" ",@class," ")," {clazz} ")')
    
    def contains(self, text: str):
        return self.predicate(f'contains(.,"{text}")')

def VBtn(content=None):
    xpath = XPath().with_class('v-btn')
    if content:
        # xpath = f'{xpath}[*[@class="v-btn__content"][contains(.,"{content}")]]'
        xpath = xpath[XPath().with_class('v-btn__content').contains(content)]
    return xpath

print(VBtn())
print(VBtn('click me!'))
print(VBtn(content='New Dandiset'))
print(VBtn('foo')/VBtn('bar'))
print(VBtn('foo')//VBtn('bar'))
print(VBtn('foo')[VBtn('bar')])
