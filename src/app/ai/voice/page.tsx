import { VoiceBot } from '@/components/VoiceBot';

export const metadata = {
  title: 'Voice AI | Study Spaces',
  description: 'Speech to text and text to speech using ElevenLabs.',
};

export default function VoiceAIPage() {
  return (
    <div className="container py-12 md:py-24 space-y-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Voice AI
        </h1>
        <p className="text-xl text-muted-foreground">
          A seamless demonstration of Speech-to-Text via the browser, and Text-to-Speech via ElevenLabs.
        </p>
      </div>
      
      <VoiceBot />
    </div>
  );
}
