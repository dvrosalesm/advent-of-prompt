"use client";

import { useLanguage } from "@/components/language-provider";
import { LanguageToggle } from "@/components/ui/language-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChristmasLights } from "@/components/ui/christmas-lights";

type Challenge = {
  id: number;
  day: number;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  difficulty: string;
  difficultyEs: string;
};

type HomeClientProps = {
  sessionName: string;
  allChallenges: Challenge[];
  completedChallengeIds: Set<number>;
};

export default function HomeClient({ sessionName, allChallenges, completedChallengeIds }: HomeClientProps) {
  const { t, language } = useLanguage();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.redirectTo) {
          router.push(data.redirectTo);
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen p-8 font-sans z-10 relative text-christmas-cream">
      <ChristmasLights />

      <header className="flex flex-col md:flex-row justify-between items-center mb-12 max-w-6xl mx-auto backdrop-blur-md p-6 rounded-2xl border border-christmas-cream/10 mt-8">
        <div className="text-center md:text-left mb-6 md:mb-0">
          <h1 className="text-5xl font-bold text-christmas-green font-display tracking-wider">
            {t.title}
          </h1>
          <p className="text-christmas-green/80 mt-2 text-lg">Hey, <span className="text-christmas-red font-bold">{sessionName}</span></p>
        </div>
        <div className="flex gap-4 items-center bg-christmas-cream/60 p-2 rounded-full border border-christmas-cream/10">
          <Link
            href="/gallery"
            className="px-4 py-2 rounded-full text-sm font-bold text-christmas-green hover:bg-christmas-cream/10 transition-all"
          >
            {t.gallery}
          </Link>
          <Link
            href="/leaderboard"
            className="px-4 py-2 rounded-full text-sm font-bold text-christmas-green hover:bg-christmas-cream/10 transition-all"
          >
            {t.leaderboard}
          </Link>
          <div className="h-6 w-px bg-christmas-green/20"></div>
          <LanguageToggle />
          <button onClick={handleLogout} className="px-4 py-2 rounded-full text-sm font-bold text-christmas-red hover:bg-christmas-red/10 transition-all">
            {t.signOut}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 perspective-1000 pb-12">
        {allChallenges.map((challenge) => {
          const isCompleted = completedChallengeIds.has(challenge.id);
          const title = language === "es" ? challenge.titleEs : challenge.title;

          return (
            <Link
              key={challenge.id}
              href={`/challenge/${challenge.day}`}
              className={`relative aspect-[4/5] group transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 ${isCompleted ? 'z-0' : 'z-10'}`}
            >
              {/* Card Container */}
              <div className={`absolute inset-0 rounded-xl shadow-lg overflow-hidden border-2 transition-all duration-300 ${isCompleted
                ? "bg-christmas-red border-christmas-red text-christmas-cream"
                : "bg-christmas-cream border-christmas-cream/50 hover:border-christmas-red hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                }`}>

                {/* Pattern/Texture */}
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${isCompleted ? 'white' : '#2c4f2b'} 1px, transparent 0)`, backgroundSize: '16px 16px' }}>
                </div>

                {/* Top Hole for "Hanging" */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-christmas-green rounded-full shadow-inner border border-christmas-cream/20 z-20"></div>

                {/* Content */}
                <div className="h-full flex flex-col items-center justify-between p-6 pt-8 text-center">

                  {/* Number */}
                  <div className={`font-display text-6xl font-bold transition-colors duration-300 ${isCompleted ? "text-christmas-cream" : "text-christmas-green group-hover:text-christmas-red"
                    }`}>
                    {challenge.day}
                  </div>

                  {/* Title (Hidden until hover or solved) */}
                  <div className={`transform transition-all duration-300 ${isCompleted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0"
                    }`}>
                    <h3 className={`text-sm font-bold leading-tight mb-2 ${isCompleted ? "text-christmas-cream" : "text-christmas-green"}`}>
                      {title}
                    </h3>
                    <div className={`text-[10px] uppercase tracking-wider font-bold ${isCompleted ? "text-christmas-cream/80" :
                      challenge.difficulty === 'Hard' ? 'text-christmas-red' :
                        'text-christmas-green/70'
                      }`}>
                      {challenge.difficulty}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="w-full">
                    {isCompleted ? (
                      <div className="w-8 h-8 mx-auto bg-christmas-cream text-christmas-red rounded-full flex items-center justify-center font-bold shadow-md animate-bounce">
                        ✓
                      </div>
                    ) : (
                      <div className="w-8 h-8 mx-auto bg-christmas-green/10 rounded-full flex items-center justify-center text-christmas-green/40 group-hover:bg-christmas-red group-hover:text-white transition-all">
                        →
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </main>
    </div>
  );
}
