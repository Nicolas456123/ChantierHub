import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { styles } from "./styles";

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string }[];
  attrs?: Record<string, unknown>;
}

export function renderTiptapContent(json: string): React.ReactNode[] {
  if (!json || json === "{}" || json === '""') return [];

  let doc: TiptapNode;
  try {
    const parsed = JSON.parse(json);
    if (parsed.type === "doc") {
      doc = parsed;
    } else if (parsed.text && typeof parsed.text === "string") {
      // Legacy format: { text: "..." }
      return [
        <Text key="legacy" style={styles.paragraph}>
          {parsed.text}
        </Text>,
      ];
    } else {
      return [];
    }
  } catch {
    // Plain text
    if (json.trim()) {
      return [
        <Text key="plain" style={styles.paragraph}>
          {json}
        </Text>,
      ];
    }
    return [];
  }

  if (!doc.content) return [];
  return doc.content.map((node, i) => renderNode(node, i));
}

function renderNode(node: TiptapNode, key: number): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <Text key={key} style={styles.paragraph}>
          {renderInline(node.content)}
        </Text>
      );

    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const style = level === 2 ? styles.heading2 : styles.heading3;
      return (
        <Text key={key} style={style}>
          {renderInline(node.content)}
        </Text>
      );
    }

    case "bulletList":
      return (
        <View key={key}>
          {(node.content ?? []).map((item, j) => (
            <View key={j} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listContent}>
                {renderInline(item.content?.[0]?.content)}
              </Text>
            </View>
          ))}
        </View>
      );

    case "orderedList":
      return (
        <View key={key}>
          {(node.content ?? []).map((item, j) => (
            <View key={j} style={styles.listItem}>
              <Text style={styles.listBullet}>{j + 1}.</Text>
              <Text style={styles.listContent}>
                {renderInline(item.content?.[0]?.content)}
              </Text>
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
}

function renderInline(nodes?: TiptapNode[]): React.ReactNode {
  if (!nodes) return null;

  return nodes.map((node, i) => {
    if (node.type === "text") {
      const text = node.text ?? "";
      const marks = node.marks ?? [];

      const markStyles: Style[] = [];
      for (const mark of marks) {
        if (mark.type === "bold") markStyles.push(styles.bold);
        if (mark.type === "italic") markStyles.push(styles.italic);
        if (mark.type === "underline")
          markStyles.push({ textDecoration: "underline" } as Style);
      }

      if (markStyles.length > 0) {
        return (
          <Text key={i} style={markStyles}>
            {text}
          </Text>
        );
      }
      return text;
    }

    if (node.type === "hardBreak") {
      return "\n";
    }

    return null;
  });
}
