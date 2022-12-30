/* eslint-disable @typescript-eslint/no-unused-vars */

type AttributeDict = Record<string, Record<string, string | null>>;

export interface Options {
  namespaces?: string[];
  considerDescs?: boolean;
  considerPrivates?: boolean;
}

// interface EnumVal {
//   ord: string | null;
//   desc?: string | null;
//   content: string | null;
//   extAttributes?: number;
// }

// interface EnumType {
//   childCount: Number;
//   desc?: string | null;
//   childHash: string;
// }

// interface Private {
//   type: string | null;
//   source: string | null;
//   content: string | null;
//   children: number;
//   childHash: string | null;
//   extAttributes: Array<[string, string]>;
//   extContent?: string;
// }

// interface Text {
//   source: string | null;
//   content: string | null;
//   children: number;
// }

interface SclBase {
  tagName: string;
  attributes: AttributeDict;
  textContent: string | null;
  childHash: string | null;
}

interface SclElementOptions {
  attributeNames: string[];
  childNames: string[];
  includeTextContent?: boolean;
  includePrivate?: boolean;
  includeDescription?: boolean;
}

type ModelSCLElement = SclBase;
// | EnumVal | EnumType | Private | Text;

type ModelTextNode = string;

// eslint-disable-next-line no-use-before-define
type ModelXMLNode = ModelXMLElement | ModelSCLElement | ModelTextNode;

interface ModelXMLElement {
  tagName: string;
  attributes: AttributeDict;
  textContent: string | null;
  childHash: string | null;
}

function getElementTextOrCDataContent(element: Element): string | null {
  const nodeTexts: string[] = [];

  // Ensure cross-platform for encoding
  function filterWhitespaceLines(textArray: string[]): string | null {
    const filteredText: string[] = [];
    const whitespaceLine = /(?:^\s+$)/;

    textArray.forEach(text => {
      if (!whitespaceLine.test(text)) {
        // If it is not a line of whitespace.
        filteredText.push(text.trim());
      }
    });

    if (filteredText.length > 0) {
      return filteredText.join('');
    }

    return null; // No text to return.
  }

  if (!element.hasChildNodes()) {
    return null;
  }

  element.childNodes.forEach(child => {
    if ([Node.TEXT_NODE, Node.CDATA_SECTION_NODE].includes(child.nodeType))
      nodeTexts.push(child.nodeValue || '');
  });

  if (nodeTexts.length > 0) {
    return filterWhitespaceLines(nodeTexts);
  }

  return null;
}

function transformSclElement(
  element: Element,
  elementOpts: SclElementOptions,
  opts: Options
): SclBase {
  let attributes: AttributeDict = {};

  for (let i = 0; i < element.attributes.length; i += 1) {
    const attr = element.attributes[i];
    if (
      opts.namespaces?.includes(attr.namespaceURI ?? 'null') ||
      elementOpts.attributeNames.includes(attr.name) ||
      (attr.name === 'desc' &&
        elementOpts.includeDescription &&
        opts.considerDescs)
    ) {
      const attrInfo = {
        [attr.name]: {
          value: attr.value,
          namespace: attr.namespaceURI,
        },
      };
      attributes = { ...attributes, ...attrInfo };
    }
  }

  const textContent = elementOpts.includeTextContent
    ? getElementTextOrCDataContent(element)
    : '';

  const childHash = Array.from(element.children)
    .filter(
      child =>
        elementOpts.childNames.includes(child.tagName) ||
        opts.namespaces?.includes(child.namespaceURI || '') ||
        (child.tagName === 'Private' &&
          elementOpts.includePrivate &&
          opts.considerPrivates)
    )
    // eslint-disable-next-line no-use-before-define
    .map(c => hashNode(c, opts))
    .join('');

  return { tagName: element.tagName, attributes, textContent, childHash };
}

function transformEnumVal(enumVal: Element, opts: Options): SclBase {
  return transformSclElement(
    enumVal,
    {
      attributeNames: ['ord'],
      childNames: [],
      includeTextContent: true,
      includePrivate: false,
      includeDescription: true,
    },
    opts
  );
}

function transformEnumType(enumType: Element, opts: Options): SclBase {
  return transformSclElement(
    enumType,
    {
      attributeNames: [],
      childNames: ['EnumVal', 'Text'],
      includeTextContent: true,
      includePrivate: true,
      includeDescription: true,
    },
    opts
  );
}

function transformPrivate(privateSCL: Element, opts: Options): SclBase {
  return transformSclElement(
    privateSCL,
    {
      attributeNames: ['type', 'source'],
      childNames: [],
      includeTextContent: true,
      includePrivate: false,
      includeDescription: false,
    },
    opts
  );
}

function transformText(text: Element, opts: Options): SclBase {
  return transformSclElement(
    text,
    {
      attributeNames: ['source'],
      childNames: [],
      includeTextContent: true,
      includePrivate: false,
      includeDescription: false,
    },
    opts
  );
}

const sclTransforms: Partial<
  Record<string, (element: Element, opts: Options) => ModelSCLElement>
> = {
  EnumVal: transformEnumVal,
  EnumType: transformEnumType,
  Private: transformPrivate,
  Text: transformText,
};

function transformElement(element: Element, opts: Options): ModelXMLElement {
  let attributes: AttributeDict = {};

  for (let i = 0; i < element.attributes.length; i += 1) {
    const attr = element.attributes[i];
    if (
      opts.namespaces?.includes(attr.namespaceURI ?? 'null') ||
      attr.namespaceURI === null
    ) {
      const attrInfo = {
        [attr.name]: {
          value: attr.value,
          namespace: attr.namespaceURI,
        },
      };
      attributes = { ...attributes, ...attrInfo };
    }
  }

  const textContent = getElementTextOrCDataContent(element);

  const childHash = Array.from(element.children)
    // eslint-disable-next-line no-use-before-define
    .map(c => hashNode(c, opts))
    .join('');

  return {
    tagName: element.tagName,
    attributes,
    textContent,
    childHash,
  };
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

class SCLDocumentHash {
  doc: XMLDocument;

  constructor(doc: XMLDocument) {
    this.doc = doc;

    console.log(this.doc);
  }
}
