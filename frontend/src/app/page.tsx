import { AudioWatermarker } from "@/components/AudioWatermarker"; // Adjust path if needed

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-12">
      {/* You can add other layout elements here if needed */}
      <AudioWatermarker></AudioWatermarker>
    </main>
  );
}