'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Play, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Declare types for Web Speech API to avoid TypeScript errors
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceBot() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessingTTS, setIsProcessingTTS] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(prev => {
        // We might want to append or just replace. For simplicity, we just take the latest interim or final result
        // Wait, for continuous mode, we should append final results and only update interim.
        // Let's do a simple replace with the full transcript history from this session.
        let fullTranscript = '';
        for (let j = 0; j < event.results.length; j++) {
            fullTranscript += event.results[j][0].transcript;
        }
        return fullTranscript;
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    setError(null);
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setAudioUrl(null);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
        setError("Failed to start recording. You may have denied microphone permissions.");
      }
    }
  };

  const handlePlayTTS = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessingTTS(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to synthesize speech');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Auto-play
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }

    } catch (err: any) {
      console.error("TTS Error:", err);
      setError(err.message || "An error occurred while generating speech");
    } finally {
      setIsProcessingTTS(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-6 w-6 text-primary" />
          Voice Interaction
        </CardTitle>
        <CardDescription>Speak into your microphone, then hear it spoken back with ElevenLabs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex gap-4">
            <Button 
              size="lg" 
              variant={isRecording ? "destructive" : "default"}
              onClick={toggleRecording}
              className={`rounded-full h-16 w-16 p-0 transition-all ${isRecording ? 'animate-pulse ring-4 ring-destructive/30' : ''}`}
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {isRecording ? "Listening... Click to stop" : "Click to start speaking"}
          </p>
        </div>

        <div className="min-h-[120px] p-4 rounded-xl bg-muted/50 border border-border text-foreground relative">
          {!transcript && !isRecording && (
            <span className="text-muted-foreground/60 italic absolute top-4 left-4">
              Your transcribed text will appear here...
            </span>
          )}
          <p className="whitespace-pre-wrap">{transcript}</p>
        </div>

      </CardContent>
      <CardFooter className="bg-muted/30 flex justify-between border-t p-4">
        <Button 
          variant="secondary" 
          onClick={() => {
            setTranscript('');
            setAudioUrl(null);
            setError(null);
          }}
          disabled={isRecording || !transcript}
        >
          Clear
        </Button>
        
        <Button 
          onClick={handlePlayTTS} 
          disabled={!transcript || isRecording || isProcessingTTS}
          className="gap-2"
        >
          {isProcessingTTS ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Voice...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Play with ElevenLabs
            </>
          )}
        </Button>
      </CardFooter>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" controls />
    </Card>
  );
}
