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

export function getHash(text: string): string {
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

export function nodeHash(node: Element): string {
  // for (const name of node.getAttributeNames()) {
  //   const value = node.getAttribute(name);
  //   console.log(name, value);
  // }

  const attrs = node
    .getAttributeNames()
    .map(name => `${name}=${node.getAttribute(name)}`);

  let contentText;
  if (node.firstChild?.nodeType === Node.TEXT_NODE) {
    contentText = node.firstChild.textContent;
  }
  const content = `${node.tagName}: ${attrs} ${contentText}`;
  return getHash(content);
}
