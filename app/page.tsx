import Link from 'next/link';
import { NavBar } from '@/components/nav-bar';
import { Heart, MessageCircle, Share2, Clock, Flame, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <NavBar />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              Tendances Automobiles
            </h1>
            <p className="text-gray-600 mt-2">Découvrez les dernières actualités du monde automobile</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Populaire
            </Button>
            <Button variant="outline" className="gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Récent
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Avatar 
              key={i}
              className="w-full h-32 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all bg-gradient-to-r from-gray-200 to-gray-100"
            />
          ))}
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((section) => (
            <Link href={`/post/${section}`} key={section}>
              <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur border-0 hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10 border-2 border-gray-200" />
                      <div>
                        <h4 className="font-medium">Jean-Michel Passion</h4>
                        <p className="text-sm text-gray-500">Passionné automobile</p>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {section === 1 
                        ? "La BMW M3 CS : Une Symphonie de Puissance et d'Élégance"
                        : "Super M3CS de fou vous êtes même pas prêts !!"
                      }
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {section === 1 
                        ? "La BMW M3 CS est bien plus qu'une simple voiture : c'est une déclaration d'amour à la performance automobile. Depuis sa création, la M3 a toujours été synonyme de dynamisme..."
                        : "Oui euh alors la enfaite c'est la description du poste et blablablabla etc ta capté ou quoi le boss..."
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 ml-4">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">13h40</span>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-sm">24</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">12</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                    <Share2 className="w-4 h-4 mr-1" />
                  </Button>
                </div>
              </Card>
            </Link>
          ))}

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