import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/api/rbac";
import { analyzePlantPhoto } from "@/lib/ai/vision";
import { ENV } from "@/lib/env";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "director"]);
  if (!auth.ok) return auth.response;

  try {
    ENV.OPENAI_API_KEY();
  } catch {
    return NextResponse.json({ ok: false, error: "Не задан OPENAI_API_KEY в .env" }, { status: 500 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Загрузите фото (JPEG/PNG/WebP)" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ ok: false, error: "Формат: JPEG, PNG или WebP" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Файл больше 5 МБ" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");

  const result = await analyzePlantPhoto(base64, file.type);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Не удалось проанализировать фото" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, result });
}
