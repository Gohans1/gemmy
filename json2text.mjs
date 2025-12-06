import fs from "fs/promises";

const INPUT_FILE = "quotes_corrected.json";
const OUTPUT_FILE = "quotes_multiline.txt"; // Tên mới

async function convert() {
	const data = JSON.parse(await fs.readFile(INPUT_FILE, "utf-8"));
	const textContent = data.quotes.join("\n\n\n"); // Nối các quote bằng 2 dòng trống
	await fs.writeFile(OUTPUT_FILE, textContent);
	console.log(`✅ Xong! File đa dòng "${OUTPUT_FILE}" đã sẵn sàng.`);
}
convert();
