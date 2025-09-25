import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dczuk4cxa";
const API_KEY = process.env.CLOUDINARY_API_KEY || "593581862893443";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "3-m1BupPsu95hNe3rRkWTJPxedM";

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId, folder } = body as {
      publicId: string;
      folder?: string;
    };

    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json({ error: "Cloudinary config missing" }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign: Record<string, string | number> = {
      public_id: publicId,
      timestamp,
    };
    if (folder) paramsToSign.folder = folder;

    const signature = cloudinary.utils.api_sign_request(paramsToSign, API_SECRET);

    return NextResponse.json({
      timestamp,
      signature,
      cloudName: CLOUD_NAME,
      apiKey: API_KEY,
      folder: folder || null,
      publicId,
    });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json({ error: "Failed to sign request" }, { status: 500 });
  }
}


