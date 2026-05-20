import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why the Boot Camp? — Jesus Boot Camp",
  description: "Read the story of how the Jesus Boot Camp was born and the Emmaus road encounter that re-ignited Paul Joseph's vision for true discipleship.",
};

export default function WhyBootCampPage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-[120px] pb-20">
        <article className="max-w-[800px] mx-auto px-6">
          
          {/* Header */}
          <div className="text-center mb-16" data-aos="fade-up">
            <span className="inline-block px-4 py-1.5 border border-gold/20 rounded-full text-[11px] font-bold tracking-[0.2em] text-gold uppercase bg-gold/5 mb-6">
              The Vision
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-navy tracking-tight max-w-[700px] mx-auto leading-[1.1] mb-6">
              Why the &ldquo;Jesus Boot Camp&rdquo; Was Born
            </h1>
            <div className="w-16 h-0.5 bg-gold/60 mx-auto rounded-full"></div>
          </div>

          {/* Content */}
          <div 
            className="max-w-[680px] mx-auto font-body text-[1.1rem] leading-[1.8] text-grey space-y-6"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p className="text-lg md:text-xl text-navy/85 font-medium leading-relaxed">
              For 45 years, my wife and I served faithfully as missionaries. We built ministries, traveled the world, and did the work of the Kingdom. But if I am being completely honest, for a long time, I was simply going through the motions of Christianity. I had the routine down, but I was lacking the one major revelation that changes everything.
            </p>

            <p>
              Then, the unexpected happened. The Lord Himself appeared to me. It was a profound, shaking, &ldquo;born-again&rdquo; revelation that re-ignited my entire life. He didn&apos;t just call me back to missions; He called me back to the core of the Gospel: true discipleship. Since that encounter, one specific passage of Scripture has completely consumed me. It’s the moment on the road to Emmaus, after two discouraged disciples had walked and talked with a &ldquo;stranger&rdquo; for nearly an entire day. The moment their eyes were opened and they realized it was Jesus, they exclaimed to each other:
            </p>

            <blockquote className="my-10 py-6 px-8 md:px-10 border-l-4 border-gold bg-cream-dark/40 rounded-r-xl shadow-[0_4px_24px_rgba(201,168,76,0.03)]">
              <p className="font-display text-xl md:text-2xl text-navy italic leading-relaxed mb-4">
                &ldquo;Did not our heart burn within us, while he talked with us by the way, and while he opened to us the scriptures?&rdquo;
              </p>
              <cite className="block text-xs font-bold tracking-wider text-gold not-italic uppercase font-body">
                — Luke 24:32
              </cite>
            </blockquote>

            <p>
              Think about that. Jesus had just systematically opened up the true meaning of who He was. He explained why He came, what He accomplished, our inheritance, our new identity, our heavenly authority, and the faith required to see the impossible. He unpacked the deep mystery of Himself, and it caused those disciples to practically burst with excitement. Their hearts were literally ablaze.
            </p>

            <p>
              For a long time after that revelation, I found myself thinking, &ldquo;Lord, I wish I could have been on that road. I want that class. I want to sit under that teaching and hear every single prophecy that foresaw your coming.&rdquo; To this day, it is my prayer that when I finally meet Jesus face-to-face, we can take that walk together so I can get the full, unfiltered rush of who He truly is.
            </p>

            <p>
              But we don&apos;t have to wait for heaven to experience that fire. That intense, burning desire became the vision and the driving force behind the &ldquo;Jesus Boot Camp&rdquo;. I created this camp to replicate that Emmaus road experience. It exists to tear open the Scriptures and reveal the staggering reality of what Jesus actually did, who He is, and what He has empowered us to be. We aren&apos;t meant to just coast through the motions of religion. Through the &ldquo;Jesus Boot Camp&rdquo;, you will discover the reality of the Great Commission; that you are personally chosen, appointed, and deputized to destroy the works of the devil and change the world with His life-giving love.
            </p>

            <div className="pt-8 border-t border-card-border/60 text-center">
              <p className="text-xl md:text-2xl font-display font-bold text-navy max-w-[480px] mx-auto leading-normal">
                Your heart was meant to be set ablaze. Let&apos;s take that walk with Him.
              </p>
            </div>

            {/* Author profile & photo */}
            <div className="pt-16 pb-6 text-center" data-aos="fade-up" data-aos-delay="200">
              <div className="relative w-44 h-44 mx-auto mb-6">
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-[0_8px_32px_rgba(26,26,26,0.06)] bg-cream-dark">
                  <Image
                    src="/images/paul-joseph.jpg"
                    alt="Paul Joseph"
                    fill
                    sizes="(max-width: 176px) 100vw, 176px"
                    className="object-cover object-top"
                    priority
                  />
                </div>
                <div className="absolute -bottom-1 right-2 w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white shadow-md border-2 border-white">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-2xl font-bold text-navy mb-1">Paul Joseph</h3>
              <p className="text-[13px] font-bold text-gold uppercase tracking-[0.15em]">Founder of Jesus Boot Camp</p>
            </div>
            
          </div>
          
        </article>
      </main>

      <Footer />
    </div>
  );
}
