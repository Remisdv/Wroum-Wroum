import { NavBar } from '@/components/nav-bar';
import { Heart, MessageCircle, Share2, Clock, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default function PostPage({ params }: { params: { id: string } }) {
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
            <p>La BMW M3 CS est bien plus qu'une simple voiture : c'est une déclaration d'amour à la performance automobile. Depuis sa création, la M3 a toujours été synonyme de dynamisme et de sophistication, et la version CS ne fait pas exception. Avec des améliorations significatives en termes de puissance, de maniabilité et de design, la M3 CS se positionne comme l'une des berlines sportives les plus désirables du marché. Plongeons ensemble dans les détails qui font de cette voiture une véritable légende sur roues ...</p>

            <h2 className="text-blue-800 text-xl font-semibold mt-6 mb-4">Une Puissance à Couper le Souffle</h2>
            <p>Sous le capot, la BMW M3 CS se montre encore plus impressionnante avec son moteur de 3.0 litres développant une puissance impressionnante de 550 chevaux. Comparée à la M3 Competition, la CS bénéficie d'une augmentation de puissance de +40 chevaux. Ce surcroît de puissance supplémentaire, combiné à un poids réduit grâce aux éléments allégés en fibre de carbone, permet à la M3 CS d'abattre le 0 à 100 km/h en seulement 3,4 secondes, et la vitesse de pointe atteint les 302 km/h avec le Pack Experience M de série.</p>

            <h2 className="text-blue-800 text-xl font-semibold mt-6 mb-4">Design et Aérodynamisme</h2>
            <p>La M3 CS est une œuvre d'art roulante. Son design extérieur est à la fois sportif et raffiné, avec des lignes fluides qui soulignent sa silhouette. La voiture est équipée de jantes en alliage M forgées exclusives de 19 pouces à l'avant et 20 pouces à l'arrière, chaussées de pneumatiques hautes performances Michelin Pilot Sport Cup 2. Le choix de nouveaux matériaux reflète parfaitement l'esprit sportif et dynamique de la M3 CS.</p>

            <h2 className="text-blue-800 text-xl font-semibold mt-6 mb-4">Conclusion</h2>
            <p>La BMW M3 CS est une voiture exceptionnelle qui combine puissance, performances et design de manière magistrale. Que vous soyez un passionné de voitures de sport ou simplement à la recherche d'une expérience de conduite intégrée, la M3 CS est une voiture qui marquera par ses vives performances. Avec sa production limitée et ses caractéristiques exclusives, elle est destinée à devenir un classique intemporel dans le monde de l'automobile.</p>
          </div>

          <div className="flex gap-4 border-t pt-4 border-blue-100">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Heart className="h-4 w-4 mr-1" />
              J'aime
            </Button>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <MessageCircle className="h-4 w-4 mr-1" />
              Commenter
            </Button>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
          </div>
        </Card>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-100 shadow-sm hover:shadow transition-shadow">
            <Avatar className="w-8 h-8 border-2 border-blue-200" />
            <div>
              <div className="font-medium text-blue-900">Pablo</div>
              <p className="text-sm text-gray-600">Oui euh alors la enfaite c'est la description du poste et blablablabla etc ta capté ou quoi le boss...</p>
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
        </div>
      </div>
    </main>
  );
}