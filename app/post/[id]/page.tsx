"use client";
import { useState } from 'react';
import { NavBar } from '@/components/nav-bar';
import { Heart, MessageCircle, Share2, Clock, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default function PostPage({ params }: { params: { id: string } }) {
  const [showCommentForm, setShowCommentForm] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <NavBar />
      
      <div className="container max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          </Link>
        </div>

        <Card className="p-6 border-blue-100 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-semibold text-blue-900">
              La BMW M3 CS : Une Symphonie de Puissance et d'Élégance sur Quatre Roues
            </h1>
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">19h40</span>
            </div>
          </div>

          <div className="prose max-w-none mb-6 text-gray-700">
            <p>
              La BMW M3 CS est bien plus qu'une simple voiture : c'est une déclaration d'amour à la performance automobile...
            </p>
            <h2 className="text-blue-800 text-xl font-semibold mt-6 mb-4">Une Puissance à Couper le Souffle</h2>
            <p>
              Sous le capot, la BMW M3 CS se montre encore plus impressionnante avec son moteur de 3.0 litres...
            </p>
            <h2 className="text-blue-800 text-xl font-semibold mt-6 mb-4">Design et Aérodynamisme</h2>
            <p>
              La M3 CS est une œuvre d'art roulante...
            </p>
            <h2 className="text-blue-800 text-xl font-semibold mt-6 mb-4">Conclusion</h2>
            <p>
              La BMW M3 CS est une voiture exceptionnelle qui combine puissance, performances et design de manière magistrale...
            </p>
          </div>

          <div className="flex gap-4 border-t pt-4 border-blue-100">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Heart className="h-4 w-4 mr-1" />
              J'aime
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setShowCommentForm((prev) => !prev)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Commenter
            </Button>

            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
          </div>
        </Card>

        {/* Affichage conditionnel du champ pour écrire un nouveau commentaire */}
        {showCommentForm && (
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-100 shadow-sm hover:shadow transition-shadow mt-6">
            <Avatar className="w-8 h-8 border-2 border-blue-200" />
            <div className="flex-1">
              <textarea
                className="w-full p-2 border border-blue-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Écrire votre commentaire..."
              ></textarea>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-100 shadow-sm hover:shadow transition-shadow">
            <Avatar className="w-8 h-8 border-2 border-blue-200" />
            <div>
              <div className="font-medium text-blue-900">Pablo</div>
              <p className="text-sm text-gray-600">
                Oui euh alors là en fait c'est la description du poste et blablablabla...
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-blue-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">19h42</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-100 shadow-sm hover:shadow transition-shadow">
            <Avatar className="w-8 h-8 border-2 border-blue-200" />
            <div>
              <div className="font-medium text-blue-900">Théo</div>
              <p className="text-sm text-gray-600">Moi j'suis chaud de fou gngngngngng</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-blue-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">19h45</span>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="w-full max-w-sm bg-white hover:bg-gray-50">
              Voir plus d'articles
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
