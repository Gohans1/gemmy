import fs from "fs/promises";

const INPUT_FILE = "quotes_corrected.json"; // File json sạch của m
const OUTPUT_FILE = "quotes.txt";

async function convert() {
	const data = JSON.parse(await fs.readFile(INPUT_FILE, "utf-8"));
	// Nối các quote lại, mỗi quote 1 dòng
	const textContent = data.quotes.join("\n");
	await fs.writeFile(OUTPUT_FILE, textContent);
	console.log("✅ Xong! Đã ỉa ra file quotes.txt");
}

convert();
