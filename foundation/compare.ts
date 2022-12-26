/* eslint-disable @typescript-eslint/no-unused-vars */
type ExclusionType = {
  nodeName: string;
  attribute: string;
};

type ExclusionsType = ExclusionType[] | [];

/* eslint-disable no-console */
function differenceInFirstArray(array1: Element[], array2: Element[]) {
  return array1.filter(
    current =>
      array2.filter(currentB => currentB.isEqualNode(current)).length === 0
  );
}

function filterByDifference(
  array1: Element[],
  array2: Element[]
): [Element[], Element[]] {
  const onlyInA = differenceInFirstArray(array1.flat(), array2.flat());
  const onlyInb = differenceInFirstArray(array2.flat(), array1.flat());
  return [onlyInA, onlyInb];
}

// function getMapValues(
//   map: Map<string, Element | Element[]>,
//   key: string
// ) {
//   if (map.get(key)!.constructor.name === 'Element') {
//     return map.get(key)!
//   } else {
//     (<Element[]>map.get(key)!).forEach((arrItem) => {
//       console.log(arrItem);
//     });
//   }
// }

export function compareMaps(
  map1: Map<string, Element[] | Element>,
  map2: Map<string, Element[] | Element>
) {
  const sameKeyDifferentValues = [];
  const onlyIn1 = [];
  const onlyIn2 = [];
  for (const key of map1.keys()) {
    if (map2.has(key)) {
      if (Array.isArray(map1.get(key)!) || Array.isArray(map2.get(key)!))
        // if (map1.get(key) !== map2.get(key)) {
        sameKeyDifferentValues.push(
          filterByDifference(
            [...(<Element[]>map1.get(key))],
            [...(<Element[]>map2.get(key))]
          )
        );
      // }
    } else {
      onlyIn1.push(map1.get(key));
    }
  }
  for (const key of map2.keys()) {
    if (!map1.has(key)) {
      onlyIn2.push(map2.get(key));
    }
  }
  console.log('Same key, different values');
  console.log(sameKeyDifferentValues);
  console.log('only in 1');
  console.log(onlyIn1);
  console.log('only in 2');
  console.log(onlyIn2);
}

// https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed/145633#145633
// 64 bit output, seems OK.
export function hashText(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0, ch; i < text.length; i += 1) {
    ch = text.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    h1 = Math.imul(h1 ^ ch, 2654435761);
    // eslint-disable-next-line no-bitwise
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    // eslint-disable-next-line no-bitwise
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    // eslint-disable-next-line no-bitwise
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    // eslint-disable-next-line no-bitwise
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    // eslint-disable-next-line no-bitwise
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${
    // eslint-disable-next-line no-bitwise
    (h2 >>> 0).toString(16).padStart(8, '0') +
    // eslint-disable-next-line no-bitwise
    (h1 >>> 0).toString(16).padStart(8, '0')
  }`;
}

// API
// hashes the node but does not include the children
// does not include XML comments or processing instructions
export function hashXMLNode(
  node: Element,
  exclusions: ExclusionsType = [],
  namespaces: string[] = []
): string | null {
  // node not in correct namespace
  if (!(node.namespaceURI === null || namespaces.includes(node.namespaceURI)))
    return null;

  // don't include comments, processing instructions or doctypes
  if (
    [
      Node.COMMENT_NODE,
      Node.PROCESSING_INSTRUCTION_NODE,
      Node.DOCUMENT_TYPE_NODE,
    ].includes(node.nodeType)
  )
    return null;

  const nodeBits = [];

  // include tag name
  nodeBits.push(node.nodeName);

  // include namespace
  if (!(node.namespaceURI === null)) nodeBits.push(node.namespaceURI);

  // include attributes and their namespaces
  for (let i = 0; i < node.attributes.length; i += 1) {
    const attr = node.attributes[i];
    if (attr!.namespaceURI === null || namespaces.includes(attr.namespaceURI)) {
      nodeBits.push(`${attr.name}[${attr.namespaceURI}]=${attr.value}`);
    }
  }

  // text node or character data
  if ([Node.TEXT_NODE, Node.CDATA_SECTION_NODE].includes(node.nodeType)) {
    nodeBits.push(node.textContent);
  }

  // we hash the string result
  return hashText(nodeBits.join(' '));
}

export function normalizeSCLNode(
  node: Element,
  includePrivate: boolean = true,
  includeDescriptions: boolean = true
): Element | null {
  const nodeCopy = <Element>node.cloneNode(false);
  if (nodeCopy.nodeName === 'Private' && includePrivate === false) return null;

  if (!includeDescriptions) {
    nodeCopy.removeAttribute('desc');
  }

  if (nodeCopy.nodeName === 'ExtRef') {
    if (nodeCopy.getAttribute('lnInst') === '') {
      nodeCopy.setAttribute('lnInst', 'LLN0');
    }

    if (
      !nodeCopy.hasAttribute('srcLDInst') ||
      nodeCopy.getAttribute('srcLDInst') === ''
    ) {
      nodeCopy.setAttribute('srcLDInst', nodeCopy.getAttribute('ldInst')!);
    }

    if (
      !nodeCopy.hasAttribute('srcLNClass') ||
      nodeCopy.getAttribute('srcLNClass') === ''
    ) {
      nodeCopy.setAttribute('srcLNClass', 'LLN0');
    }

    if (!nodeCopy.hasAttribute('srcLNInst')) {
      nodeCopy.setAttribute('srcLNInst', '');
    }

    if (!nodeCopy.hasAttribute('srcCBName')) {
      nodeCopy.removeAttribute('srcLDInst');
      nodeCopy.removeAttribute('srcPrefix');
      nodeCopy.removeAttribute('srcLNClass');
      nodeCopy.removeAttribute('srcLNInst');
    }
  }
  // now do for every other node !!

  return nodeCopy;
}

function isPublic(element: Element): boolean {
  return !element.closest('Private');
}

export function hashSCLNode(
  node: Element,
  namespaces: string[] = [],
  exclusions: ExclusionsType = [],
  includePrivate: boolean = false,
  includeDescriptions = true
): string | null {
  if (!isPublic(node)) return null;

  const normalizedNode = normalizeSCLNode(
    node,
    includePrivate,
    includeDescriptions
  );
  if (normalizedNode === null) return null;

  // We always include the SCL namespace
  return hashXMLNode(normalizedNode, exclusions, [
    'http://www.iec.ch/61850/2003/SCL',
    ...namespaces,
  ]);
}

export function linearHash(
  nodes: Element[],
  exclusions: ExclusionsType = [],
  namespaces: string[] = [],
  includePrivate: boolean = false,
  includeDescriptions = true
): string {
  let nodeHash = '';
  Array.from(nodes).forEach(node => {
    const hash = hashSCLNode(
      node,
      namespaces,
      exclusions,
      includePrivate,
      includeDescriptions
    );
    if (hash !== null) {
      nodeHash = `${nodeHash}${hash}`;
    }
  });

  return nodeHash;
}

export function hashNodeRecursively(
  rootNode: Element,
  namespaces: string[],
  exclusions: ExclusionsType = []
): Map<string, Element | Element[]> {
  let reHash: string[] = [];
  let previousDepth = 0;
  const hashTable = new Map();
  const depthTracker = new Map();
  let qtyAtDepth = 0;

  function postOrderTraversal(node: Element, currentDepth = 0) {
    // Traverse the tree leaves first
    for (const child of Array.from(node.children)) {
      postOrderTraversal(child, currentDepth + 1);
    }

    // calculate hash for current node, excluding children
    const childlessHash = hashSCLNode(node, namespaces, exclusions);
    // allocate hash for current node, including children
    let childedHash: string = '';

    // check how many are at the current depth
    // if (currentDepth === this.previousDepth)
    depthTracker.set(currentDepth, (qtyAtDepth += 1));

    if (childlessHash !== null) {
      // add hash to list of hashes to hash together for higher level nodes
      reHash = reHash.concat(childlessHash);

      // we are now traversing upwards, we must hash the children and this node and store the result
      if (previousDepth > currentDepth && reHash.length !== 0) {
        // console.log(this.reHash, 'HASHING THE HECK');
        const combinedHash = hashText(
          reHash
            .slice(depthTracker.get(currentDepth))
            .join('')
            .concat(childlessHash)
        );

        reHash = [combinedHash];
        childedHash = combinedHash;
      } else {
        childedHash = childlessHash;
      }

      // reset tracking metadata
      qtyAtDepth = 0;

      const nodeHash = `${childedHash}_${childlessHash}`;
      // add to index
      if (hashTable.has(childlessHash)) {
        const existingValues = hashTable.get(nodeHash);
        hashTable.set(nodeHash, [existingValues].concat(node));
      } else {
        hashTable.set(nodeHash, node);
      }
    }
    previousDepth = currentDepth;
  }

  postOrderTraversal(rootNode);

  return hashTable;
}

export function getXmlRootNamespaces(doc: Document): string[] {
  const rootElement = doc.documentElement;
  const namespaces: string[] = [];
  for (let i = 0; i < rootElement.attributes.length; i += 1) {
    const attr = rootElement.attributes[i];
    if (attr.name.startsWith('xmlns:') || attr.name === 'xmlns') {
      namespaces.push(attr.value);
    }
  }
  return namespaces;
}

// assumes uniqueness
export function swapMap<K, V>(map: Map<K, V>): Map<V, K> {
  const result = new Map<V, K>();
  for (const [key, value] of map.entries()) {
    result.set(value, key);
  }
  return result;
}

/*

  [
    {ord: '1', content: 'blocked'},
    {ord: '0', content: 'on', extAttributes: { 'https://example.org' : {'my': 'attr'}}},
    {ord: '1', content: 'blocked'},
  ]

   */

type AttributeDict = Record<string, Record<string, string>>;

export type Options = {
  namespaces?: string[];
  considerDescs?: boolean;
  considerPrivates?: boolean;
};

type EnumVal = {
  ord: string | null;
  desc?: string | null;
  content: string | null;
  extAttributes?: number;
};

type EnumType = { childCount: Number; desc?: string | null; childHash: string };

type Private = {
  type: string | null;
  source: string | null;
  content: string | null;
  children: number;
  extAttributes: Array<[string, string]>;
  extContent?: string;
};

type Text = {
  source: string | null;
  content: string | null;
  children: number;
};

type ModelSCLElement = EnumVal | EnumType | Private | Text;

type ModelTextNode = string;

// eslint-disable-next-line no-use-before-define
type ModelXMLNode = ModelXMLElement | ModelSCLElement | ModelTextNode;

type ModelXMLElement = {
  tagName: string;
  attributes: AttributeDict;
  children: ModelXMLNode[];
};

function transformEnumVal(enumVal: Element, opts: Options): EnumVal {
  const ord = enumVal.getAttribute('ord');
  const desc = opts.considerDescs ? enumVal.getAttribute('desc') : undefined;

  const content = enumVal.textContent;
  const extAttributes = Array.from(enumVal.attributes).filter(
    a =>
      a.namespaceURI !== 'http://www.iec.ch/61850/2003/SCL' &&
      opts.namespaces?.includes(a.namespaceURI ?? '')
  ).length;
  return { ord, desc, content, extAttributes };
}

function transformEnumType(enumType: Element, opts: Options): EnumType {
  const desc = opts.considerDescs ? enumType.getAttribute('desc') : undefined;

  let children = Array.from(enumType.childNodes).filter(
    n => n.nodeType !== Node.COMMENT_NODE
  );

  if (!opts.considerPrivates) {
    children = children.filter(n => n.nodeName !== 'Private');
  }

  children = children.filter(
    n =>
      n.isDefaultNamespace('http://www.iec.ch/61850/2003/SCL') ||
      opts.namespaces?.includes((<Element>n).namespaceURI ?? '')
  );

  // eslint-disable-next-line no-use-before-define
  const childHash = children.map(c => hashNode(c, opts)).join('');

  return { childCount: children.length, desc, childHash };
}

function transformPrivate(privateSCL: Element, opts: Options): Private {
  const type = privateSCL.getAttribute('type');
  const source = privateSCL.getAttribute('source');
  const content = privateSCL.textContent;

  const children = Array.from(privateSCL.children).filter(c =>
    opts.namespaces?.includes(c.namespaceURI ?? '')
  );

  const extAttributes: [string, string][] = Array.prototype.slice
    .call(privateSCL.attributes)
    .map(attr => [attr.key, attr.value]);

  return { type, source, content, extAttributes, children: children.length };
}

function transformText(text: Element, opts: Options): Text {
  const source = text.getAttribute('source');
  const content = text.textContent;

  const children = Array.from(text.children).filter(c =>
    opts.namespaces?.includes(c.namespaceURI ?? '')
  ).length;

  return { source, content, children };
}

const sclTransforms: Partial<
  Record<string, (element: Element, opts: Options) => ModelSCLElement>
> = {
  EnumVal: transformEnumVal,
  EnumType: transformEnumType,
  Private: transformPrivate,
  Text: transformText,
};

function transformElement(element: Element, _opts: Options): ModelXMLElement {
  return { tagName: element.tagName, attributes: {}, children: [] };
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function transformNode(node: Node, opts: Options): ModelXMLNode {
  if (isElement(node)) {
    const sclTransform =
      node.namespaceURI === 'http://www.iec.ch/61850/2003/SCL'
        ? sclTransforms[node.tagName]
        : null;
    if (sclTransform) return sclTransform(node, opts);
    return transformElement(node, opts);
  }
  return '';
}

function hashString(str: string): string {
  return str;
}

export function hashNode(node: Node, opts: Options = {}): string {
  return hashString(JSON.stringify(transformNode(node, opts)));
}

export function hashSCL(doc: Document, namespaces: string[]) {
  const rootNode = doc.documentElement;

  const dataTypes = rootNode.querySelector(':root > DataTypeTemplates');
  const enumTypes = Array.from(dataTypes!.querySelectorAll('EnumType'));
  let enumTypeHashes = new Map();

  // exclusions are for pure references that are then substituted into
  // other elements, so the id of an EnumType is just a pointer that
  // should not be hashed or otherwise preserved
  const exclusions: ExclusionsType = [
    { nodeName: 'EnumType', attribute: 'id' },
  ];

  enumTypes.forEach(type => {
    enumTypeHashes = new Map([
      ...enumTypeHashes,
      ...hashNodeRecursively(type, namespaces, exclusions),
    ]);
  });

  console.log(enumTypeHashes);
  // two objectives
  // simple compare
  //  semantic compare
  // semantic first.

  // OK now we need IDs instead of element
  // Then we need to recurse into the DTTs, following each DAType through
  // and making sure it is only tuoched one.
  // Remembering that our hashing algorithm doesn't guarantee uniqueness
  // And we need to recursively work our way into the datatype templates.

  // And can we come up with a generic approach for the substitution?
}
