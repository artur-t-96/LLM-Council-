import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        console.log("Parsing file request received");
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error("No file provided in request");
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";
        const fileName = file.name.toLowerCase();

        console.log(`Processing file: ${fileName}, type: ${file.type}`);

        if (fileName.endsWith(".pdf")) {
            const pdf = require("pdf-parse");
            const data = await pdf(buffer);
            text = data.text;
        } else if (fileName.endsWith(".docx")) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (
            fileName.endsWith(".xlsx") ||
            fileName.endsWith(".xls")
        ) {
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            text = XLSX.utils.sheet_to_csv(sheet);
        } else {
            console.error(`Unsupported file type: ${fileName}`);
            return NextResponse.json(
                { error: `Unsupported file type: ${fileName}` },
                { status: 400 }
            );
        }

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("Error parsing file:", error);
        return NextResponse.json(
            { error: `Failed to parse file: ${error.message}` },
            { status: 500 }
        );
    }
}
