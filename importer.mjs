// importer.mjs - v2.1 (Bảo tồn di sản)
import fs from "fs/promises";

// ##################################################################
// ##### DÁN LẠI TOKEN CỦA MÀY VÀO ĐÂY, CHẮC CHẮN VÀO ĐẤY!!! #####
// ##################################################################
const ACCESS_TOKEN =
	"THABBCRsp3hulBUVRRQ3BWUUFTRi1kQXBrT1BXZAG1GWXBOZAVFzNW1RZAkpHR2o0dnBZAaVBDMU9NN0xDbjJUT0pVekszQUZADV2xNTU9OUjNJRFNFaUE0U2pJeHF6XzVYWUQ0dWNPaGhUeC1HUGtlZAFREODFURUhyUkRSMjdSWTVuS0ZAtS0h1UnNqYjVpNW5fYm9OaVVneHVGMXVpMWtyWnRVeWQyZADUZD";

const OUTPUT_FILE = "quotes_final.json"; // Đổi tên file output cho chắc ăn
const LIMIT_PER_PAGE = 100;

/**
 * Hàm này sẽ dọn dẹp nhẹ nhàng một cái quote thô.
 * @param {string} text - Quote thô từ API.
 * @returns {string}
 */
function gentleCleanQuote(text) {
	if (!text) return "";
	let cleanedText = text.trim();

	// Chỉ lột bỏ dấu ngoặc kép BÊN NGOÀI CÙNG
	if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
		cleanedText = cleanedText.substring(1, cleanedText.length - 1).trim();
	}

	// Giữ lại tất cả \n và mọi thứ khác.
	return cleanedText;
}

async function fetchAllMyThreads() {
	// ... (Phần code fetch này giữ nguyên y hệt v2.0, tao copy lại cho mày) ...
	if (!ACCESS_TOKEN || ACCESS_TOKEN === "DÁN_TOKEN_CỦA_MÀY_VÀO_ĐÂY") {
		console.error(
			"🤬 ĐỊT MẸ MÀY CHƯA DÁN ACCESS TOKEN VÀO CODE KÌA THẰNG NGU!",
		);
		return [];
	}
	let allQuotes = [];
	let nextUrl = `https://graph.threads.net/v1.0/me/threads?fields=text&limit=${LIMIT_PER_PAGE}&access_token=${ACCESS_TOKEN}`;
	let page = 1;
	console.log("🔫 Bắt đầu chiến dịch bảo tồn di sản từ Threads...");

	while (nextUrl) {
		try {
			process.stdout.write(`- Đang thu thập trang ${page}... `);
			const response = await fetch(nextUrl);
			const data = await response.json();
			if (!response.ok) {
				console.error("\n🤬 LỖI API:", data.error.message);
				break;
			}
			const quotesOnPage = data.data
				.filter(
					(thread) =>
						thread.text &&
						thread.text.trim() !== "" &&
						!thread.text.includes("http"),
				) // Chỉ lọc link
				.map((thread) => gentleCleanQuote(thread.text)) // Dọn dẹp nhẹ nhàng
				.filter((quote) => quote !== "");

			allQuotes.push(...quotesOnPage);
			process.stdout.write(`OK (${quotesOnPage.length} di sản)\n`);

			await new Promise((resolve) => setTimeout(resolve, 300));
			if (data.paging && data.paging.next) {
				nextUrl = data.paging.next;
			} else {
				nextUrl = null;
			}
			page++;
		} catch (error) {
			console.error("\n💥 ĐỊT MẸ LỖI KẾT NỐI:", error);
			nextUrl = null;
		}
	}
	const reversedQuotes = allQuotes.reverse();
	console.log(
		`\n✅ Thu thập xong! Bảo tồn thành công ${reversedQuotes.length} di sản văn hóa.`,
	);
	return reversedQuotes;
}

async function saveQuotesToFile(quotes) {
	// ... (Phần code save này giữ nguyên y hệt v2.0) ...
	if (quotes.length === 0) {
		console.log("🤷‍♂️ Đéo có gì để lưu. Kết thúc.");
		return;
	}
	console.log(`💾 Đang niêm cất vào file ${OUTPUT_FILE}...`);
	const dataToWrite = {
		quotes: quotes,
	};
	await fs.writeFile(OUTPUT_FILE, JSON.stringify(dataToWrite, null, 2));
	console.log("🎉 Xong! Di sản của mày đã an toàn trong " + OUTPUT_FILE);
}

// BẮN!
fetchAllMyThreads().then(saveQuotesToFile);
