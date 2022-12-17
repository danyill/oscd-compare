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

  // include attributes
  for (let i = 0; i < node.attributes.length; i += 1) {
    const attr = node.attributes[i];
    if (attr!.namespaceURI === null || namespaces.includes(attr.namespaceURI)) {
      nodeBits.push(`${attr.name}=${attr.value}`);
    }
  }

  // text node or character data
  if ([Node.TEXT_NODE, Node.CDATA_SECTION_NODE].includes(node.nodeType)) {
    nodeBits.push(node.textContent);
  }

  // we hash the string result
  return hashText(nodeBits.join(' '));
}

export function normaliseSCLNode(
  node: Element,
  includePrivate: boolean = true,
  includeDescriptions: boolean = true
): Element | null {
  if (node.nodeName === 'Private' && includePrivate === false) return null;

  if (!includeDescriptions) {
    node.removeAttribute('desc');
  }

  if (node.nodeName === 'ExtRef') {
    if (node.getAttribute('lnInst') === '') {
      node.setAttribute('lnInst', 'LLN0');
    }

    if (
      !node.hasAttribute('srcLDInst') ||
      node.getAttribute('srcLDInst') === ''
    ) {
      node.setAttribute('srcLDInst', node.getAttribute('ldInst')!);
    }

    if (
      !node.hasAttribute('srcLNClass') ||
      node.getAttribute('srcLNClass') === ''
    ) {
      node.setAttribute('srcLNClass', 'LLN0');
    }

    if (!node.hasAttribute('srcLNInst')) {
      node.setAttribute('srcLNInst', '');
    }

    if (!node.hasAttribute('srcCBName')) {
      node.removeAttribute('srcLDInst');
      node.removeAttribute('srcPrefix');
      node.removeAttribute('srcLNClass');
      node.removeAttribute('srcLNInst');
    }
  }
  // now do for every other node !!

  return node;
}

export function hashSCLNode(
  node: Element,
  namespaces: string[] = [],
  includePrivate: boolean = false,
  includeDescriptions = true
): string | null {
  const normalisedNode = normaliseSCLNode(
    node,
    includePrivate,
    includeDescriptions
  );
  if (normalisedNode === null) return null;
  // We always include the SCL namespace
  return hashXMLNode(normalisedNode, [
    'http://www.iec.ch/61850/2003/SCL',
    ...namespaces,
  ]);
}
