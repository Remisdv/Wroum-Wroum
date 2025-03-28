"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, Eye, Heart, BarChart3, Activity, Clock, ArrowRight, ArrowLeft } from "lucide-react";

export default function StatsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [range, setRange] = useState("day");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.user?.id) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/stats?userId=${session.user.id}&range=${range}&date=${selectedDate}`);
        if (!res.ok) {
          throw new Error("Erreur lors de la récupération des statistiques");
        }
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [range, selectedDate, session]);

  // Fonction pour formater la période sélectionnée
  const formatPeriod = () => {
    if (range === "all") return "Depuis le début";
    if (range === "week") {
      const date = new Date(selectedDate);
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return new Date(selectedDate).toLocaleDateString();
  };

  // Sélection rapide de périodes
  const quickSelect = (newRange: string, date?: Date) => {
    setRange(newRange);
    if (date) {
      setSelectedDate(date.toISOString().split("T")[0]);
    }
  };

  // Fonction pour retourner à la page profil
  const handleBackToProfile = () => {
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden transition-all">
        {/* Bouton retour */}
        <div className="bg-gray-100 p-2">
          <button
            onClick={handleBackToProfile}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil
          </button>
        </div>
        
        {/* En-tête */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Tableau de bord statistiques</h1>
          </div>
          <p className="mt-2 text-blue-100">Suivez les performances de vos publications</p>
        </div>

        {/* Corps principal */}
        <div className="p-6">
          {/* Sélecteurs de période */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => quickSelect("day", new Date())} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  range === "day" && selectedDate === new Date().toISOString().split("T")[0]
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Aujourd'hui
              </button>
              <button 
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  quickSelect("day", yesterday);
                }} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  range === "day" && selectedDate === new Date(Date.now() - 86400000).toISOString().split("T")[0]
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Hier
              </button>
              <button 
                onClick={() => quickSelect("week", new Date())} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  range === "week" && selectedDate === new Date().toISOString().split("T")[0]
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cette semaine
              </button>
              <button 
                onClick={() => quickSelect("all")} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  range === "all"
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tout le temps
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Période sélectionnée: <span className="font-medium">{formatPeriod()}</span></span>
            </div>

            {range !== "all" && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  {range === "day" ? "Sélectionner une date spécifique" : "Sélectionner une semaine"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button 
                    onClick={() => quickSelect(range, new Date())}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md transition-colors text-sm"
                  >
                    Aujourd'hui
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Affichage des statistiques */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-pulse">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500">Chargement de vos statistiques...</p>
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Grands indicateurs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 shadow-sm border border-red-100">
                  <div className="flex items-center mb-2 text-red-500">
                    <Heart className="w-5 h-5 mr-2" />
                    <h3 className="text-sm font-semibold uppercase">Likes</h3>
                  </div>
                  <p className="text-4xl font-bold text-gray-800">{stats.totalLikes}</p>
                  <p className="mt-2 text-sm text-gray-600">J'aime reçus sur vos publications</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
                  <div className="flex items-center mb-2 text-blue-500">
                    <Eye className="w-5 h-5 mr-2" />
                    <h3 className="text-sm font-semibold uppercase">Vues</h3>
                  </div>
                  <p className="text-4xl font-bold text-gray-800">{stats.totalVues}</p>
                  <p className="mt-2 text-sm text-gray-600">Nombre de vues sur vos publications</p>
                </div>
              </div>

              {/* Engagement */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4 text-purple-600">
                  <Activity className="w-5 h-5 mr-2" />
                  <h3 className="text-lg font-semibold">Taux d'engagement</h3>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalVues > 0 ? (stats.totalLikes / stats.totalVues) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>Taux: {stats.totalVues > 0 ? ((stats.totalLikes / stats.totalVues) * 100).toFixed(1) : 0}%</span>
                  <span className="flex items-center">
                    <Heart className="w-3 h-3 mr-1 text-red-500" />
                    {stats.totalLikes} / 
                    <Eye className="w-3 h-3 mx-1 text-blue-500" />
                    {stats.totalVues}
                  </span>
                </div>
              </div>

              {/* Période */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4 text-green-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <h3 className="text-lg font-semibold">Période d'analyse</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Début</p>
                    <p className="text-gray-700 font-medium">
                      {stats.startDate ? new Date(stats.startDate).toLocaleDateString() : "Début de vos publications"}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Fin</p>
                    <p className="text-gray-700 font-medium">{new Date(stats.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-700">
              Aucune statistique disponible pour cette période. Essayez une autre plage de dates.
            </div>
          )}
          
          {/* Bouton retour en bas */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
              onClick={handleBackToProfile}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retourner au profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}