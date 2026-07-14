const fs = require("fs");
const path = require("path");

const tmp = path.join(process.env.TEMP, "summary_rules_docx_inspect");
const out = path.resolve("lessons/_shared/reviews/stage-01-langchain/_work");
fs.mkdirSync(out, { recursive: true });

const xml = fs.readFileSync(path.join(tmp, "word/document.xml"), "utf8");
const rels = fs.readFileSync(path.join(tmp, "word/_rels/document.xml.rels"), "utf8");

const relmap = {};
for (const match of rels.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g)) {
  relmap[match[1]] = match[2];
}

const paras = [];
const images = [];
let index = 0;

for (const paraMatch of xml.matchAll(/<w:p(?:\s|>)[\s\S]*?<\/w:p>/g)) {
  const paraXml = paraMatch[0];
  const text = [...paraXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((match) =>
      match[1]
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"'),
    )
    .join("")
    .trim();

  if (text) paras.push(text);

  for (const imageMatch of paraXml.matchAll(/r:embed="([^"]+)"/g)) {
    index += 1;
    images.push({
      id: `image-${String(index).padStart(3, "0")}`,
      rid: imageMatch[1],
      target: relmap[imageMatch[1]] || "",
      paragraph: text,
    });
  }
}

fs.writeFileSync(path.join(out, "doc_text.txt"), paras.join("\n"), "utf8");
fs.writeFileSync(path.join(out, "images.json"), JSON.stringify(images, null, 2), "utf8");

console.log(JSON.stringify({ paragraphs: paras.length, images: images.length, work: out }));
