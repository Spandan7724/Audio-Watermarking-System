'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Shield, Zap, FileAudio, Lock, ChevronRight } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-12 pb-20 md:pt-24 md:pb-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Secure Audio <span className="text-primary">Watermarking</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Protect your audio content with invisible, robust watermarks that survive processing, compression, and conversion while remaining inaudible.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/watermark">
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth">
              Sign Up Free <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white">
            <CardContent className="pt-8">
              <div className="bg-primary/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Inaudible Watermarks</h3>
              <p className="text-muted-foreground">
                Our technology embeds watermarks that are completely inaudible to human listeners while remaining detectable by our algorithms.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-8">
              <div className="bg-primary/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Robust Protection</h3>
              <p className="text-muted-foreground">
                Watermarks survive typical audio processing, including compression, format conversion, and moderate audio modifications.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-8">
              <div className="bg-primary/10 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Processing</h3>
              <p className="text-muted-foreground">
                Our optimized algorithms process your audio quickly, allowing you to protect large libraries of content efficiently.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary rounded-full text-white p-4 w-16 h-16 flex items-center justify-center mb-4">
                <FileAudio className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Upload</h3>
              <p className="text-muted-foreground">
                Upload your audio file in any common format (WAV, MP3, FLAC, etc.).
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary rounded-full text-white p-4 w-16 h-16 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Embed</h3>
              <p className="text-muted-foreground">
                Our algorithm embeds an inaudible watermark uniquely tied to your account.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-primary rounded-full text-white p-4 w-16 h-16 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Protect</h3>
              <p className="text-muted-foreground">
                Download your watermarked audio and distribute it with confidence.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/watermark">
                Try It Now <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Use Cases</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Content Creators</h3>
              <p className="text-muted-foreground">
                Protect your original audio content, music, podcasts, and sound effects from unauthorized use.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Music Labels</h3>
              <p className="text-muted-foreground">
                Secure releases and demos with watermarks to track leaks and protect intellectual property.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Podcasters</h3>
              <p className="text-muted-foreground">
                Embed your signature in podcast episodes to prove ownership and track syndication.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">AI Audio Providers</h3>
              <p className="text-muted-foreground">
                Mark AI-generated audio to ensure transparency and compliance with emerging regulations.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to protect your audio?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of creators who trust our technology to secure their valuable audio content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/watermark">
                Start Watermarking <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white hover:bg-white/10" asChild>
              <Link href="/auth">
                Create Account <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Audio Watermarking</h3>
              <p className="text-sm">
                Secure, robust, and inaudible watermarking technology for your audio content.
              </p>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>© {new Date().getFullYear()} Audio Watermarking. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;