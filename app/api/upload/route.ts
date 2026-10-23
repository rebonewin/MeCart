import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerMedia, STORAGE_BUCKETS, type StorageBucket } from "@/lib/repositories/media";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const bucketInput = String(formData.get("bucket") ?? "products");
  const folder = String(formData.get("folder") ?? "").replace(/^\/+|\/+$/g, "");

  const bucket: StorageBucket = (STORAGE_BUCKETS as readonly string[]).includes(bucketInput)
    ? (bucketInput as StorageBucket)
    : "products";

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const isVendorBucket = bucket === "vendor-assets" || bucket === "vendor-documents";
  if (isVendorBucket) {
    const vendorId = folder.split("/")[0];
    const { data: membership } = await supabase
      .from("vendor_members")
      .select("vendor_id")
      .eq("user_id", user.id)
      .eq("vendor_id", vendorId)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: "Vendor access required" }, { status: 403 });
    }
  }

  const urls: string[] = [];

  for (const file of files) {
    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${folder ? `${folder}/` : ""}${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
    urls.push(isVendorBucket && bucket === "vendor-documents" ? path : publicUrl.publicUrl);

    if (!isVendorBucket) {
      await registerMedia({
        bucket,
        path,
        url: publicUrl.publicUrl,
        name: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
        folder: folder || null,
        uploadedBy: user.id,
      });
    }
  }

  return NextResponse.json({ urls, bucket });
}
