import { supabaseServer } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonStart = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 8);
  const serviceSet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = supabaseServer();

  const { data: audio, error: audioError } = await supabase
    .from("audio_stories")
    .select("*")
    .order("title", { ascending: true });

  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("*")
    .order("title", { ascending: true });

  const { data: coloring, error: coloringError } = await supabase
    .from("coloring")
    .select("*")
    .order("title", { ascending: true });

  return (
    <div style={{ padding: 16 }}>
      <h1>Debug Supabase</h1>

      <h2>ENV</h2>
      <p>SUPABASE URL: <b>{supabaseUrl}</b></p>
      <p>ANON key starts with: <b>{anonStart}...</b></p>
      <p>SERVICE_ROLE key set: <b>{serviceSet ? "yes" : "NO"}</b></p>

      <h2>audio_stories</h2>
      {audioError && (
        <pre style={{ color: "red" }}>{String(audioError.message)}</pre>
      )}
      <pre>{JSON.stringify(audio, null, 2)}</pre>

      <h2>books</h2>
      {booksError && (
        <pre style={{ color: "red" }}>{String(booksError.message)}</pre>
      )}
      <pre>{JSON.stringify(books, null, 2)}</pre>

      <h2>coloring</h2>
      {coloringError && (
        <pre style={{ color: "red" }}>{String(coloringError.message)}</pre>
      )}
      <pre>{JSON.stringify(coloring, null, 2)}</pre>
    </div>
  );
}
