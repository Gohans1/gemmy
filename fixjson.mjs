// corrector.mjs - Cỗ máy sửa lỗi chính tả
import fs from 'fs/promises';

// ############### CONFIG CỦA MÀY ###############
const INPUT_FILE = "quotes_final.json"; // File JSON thô mày vừa hút về
const OUTPUT_FILE = "quotes_corrected.json"; // File đã được sửa lỗi, sạch bong
// ############################################

// ĐỊNH NGHĨA CÁC LUẬT SỬA LỖI Ở ĐÂY
const CORRECTION_RULES = {
    "Kaptil Gupta": "Kapil Gupta",
    "kaptil gupta": "Kapil Gupta",
    // Thêm các luật khác vào đây, ví dụ:
    // "Naval ravikant": "Naval Ravikant",
    // "@naval": "- Naval Ravikant"
};

async function correctQuotes() {
    console.log(`🧐 Đang đọc file "${INPUT_FILE}" để kiểm tra lỗi chính tả...`);

    let data;
    try {
        const fileContent = await fs.readFile(INPUT_FILE, 'utf-8');
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error(`🤬 Địt mẹ, đéo đọc được file "${INPUT_FILE}". Mày chạy script hút dữ liệu chưa?`);
        return;
    }

    if (!data.quotes || !Array.isArray(data.quotes)) {
        console.error(`🤬 File "${INPUT_FILE}" có cấu trúc như cặc. Đéo thấy mảng "quotes".`);
        return;
    }

    let correctedCount = 0;
    const correctedQuotes = data.quotes.map(quote => {
        let newQuote = quote;
        let wasCorrected = false;

        for (const [wrong, right] of Object.entries(CORRECTION_RULES)) {
            if (newQuote.includes(wrong)) {
                newQuote = newQuote.replaceAll(wrong, right);
                wasCorrected = true;
            }
        }

        if (wasCorrected) {
            correctedCount++;
        }
        return newQuote;
    });

    console.log(`✅ Sửa xong! Đã sửa lỗi cho ${correctedCount} câu quote.`);

    console.log(`💾 Đang lưu kết quả vào "${OUTPUT_FILE}"...`);
    const dataToWrite = {
        "quotes": correctedQuotes
    };
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(dataToWrite, null, 2));
    console.log("🎉 Xong! Dữ liệu của mày giờ đã sạch sẽ hơn.");
}

// Chạy cỗ máy!
correctQuotes();
