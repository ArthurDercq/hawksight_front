import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, MapPin, Activity, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/context';
import explorationMapImg from '@/assets/exploration-map.png';

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  return (
    <div className="bg-[#0B0C10] text-[#F2F2F2]">
      {/* HERO Section - Full Screen */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Map */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1645625338989-4445ba1a0c1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwdG9wb2dyYXBoaWMlMjBtYXAlMjB0ZXJyYWlufGVufDF8fHx8MTc3MjM5MDM2M3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Terrain Map"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C10]/60 via-[#0B0C10]/80 to-[#0B0C10]" />
        </div>

        {/* Animated Path Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
          <motion.path
            d="M 0 80 Q 25 20, 50 50 T 100 40"
            stroke="#E8832A"
            strokeWidth="2"
            fill="none"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
          />
        </svg>

        {/* Glowing Zones */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E8832A]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#3DB2E0]/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.h1
            className="text-5xl md:text-7xl font-heading font-bold text-[#F2F2F2] mb-8 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Maîtrise ton terrain.
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-mist/60 font-body mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Analyse tes trails. Étends ton territoire. Visualise ta progression.
          </motion.p>

          <motion.button
            onClick={handleCTA}
            className="group relative px-10 py-4 bg-[#E8832A] text-[#0B0C10] font-heading font-bold text-lg rounded-lg overflow-hidden transition-all hover:shadow-[0_0_30px_#E8832A80] hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isAuthenticated ? 'Accéder au Dashboard' : 'Se connecter'}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#E8832A] to-[#FF9D4A] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#E8832A] to-transparent" />
            <div className="w-1 h-1 rounded-full bg-[#E8832A]" />
          </div>
        </motion.div>
      </section>

      {/* Section 1 - La Conquête */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Visual */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-[#3A3F47]/30">
                <img
                  src={explorationMapImg}
                  alt="Coverage Map"
                  className="w-full aspect-square object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/20 to-transparent" />

                {/* Zone highlights — simule les zones de couverture */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Zone principale — centre-gauche */}
                  <div
                    className="absolute rounded-full blur-2xl"
                    style={{ width: '45%', height: '40%', top: '20%', left: '15%', background: 'radial-gradient(circle, #E8832A55 0%, #E8832A22 50%, transparent 70%)' }}
                  />
                  {/* Zone secondaire — centre-droit */}
                  <div
                    className="absolute rounded-full blur-xl"
                    style={{ width: '30%', height: '30%', top: '35%', left: '50%', background: 'radial-gradient(circle, #E8832A44 0%, #E8832A18 50%, transparent 70%)' }}
                  />
                  {/* Zone tertiaire — bas */}
                  <div
                    className="absolute rounded-full blur-2xl"
                    style={{ width: '25%', height: '25%', top: '55%', left: '30%', background: 'radial-gradient(circle, #E8832A33 0%, transparent 70%)' }}
                  />
                </div>

                {/* Overlay Stats */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="bg-[#0B0C10]/90 backdrop-blur-sm border border-[#E8832A]/30 rounded-lg px-4 py-3">
                    <div className="text-xs text-[#3A3F47] font-body mb-1">Couverture</div>
                    <div className="text-3xl font-mono text-[#E8832A]">8%</div>
                  </div>
                  <div className="bg-[#0B0C10]/90 backdrop-blur-sm border border-[#3DB2E0]/30 rounded-lg px-4 py-3">
                    <div className="text-3xl font-mono text-[#3DB2E0]">847 km²</div>
                  </div>
                </div>

                {/* Technical Corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-[#E8832A]/40" />
                <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-[#E8832A]/40" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-[#E8832A]/40" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-[#E8832A]/40" />
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-4 bg-[#E8832A]/5 rounded-3xl blur-2xl -z-10" />
            </motion.div>

            {/* Text */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8832A]/10 border border-[#E8832A]/30 rounded-full">
                <MapPin className="w-4 h-4 text-[#E8832A]" />
                <span className="text-xs font-body text-[#E8832A] uppercase tracking-wider">La Conquête</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#F2F2F2] leading-tight">
                Chaque sortie élargit ton empreinte.
              </h2>

              <div className="space-y-4 text-base text-[#3A3F47] font-body leading-relaxed">
                <p>Suis ton taux de couverture.</p>
                <p>Observe ton expansion.</p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E8832A]" />
                  <span className="text-sm font-mono text-[#3A3F47]">CONQUÊTE</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2 - La Stratégie */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-[#0B0C10] to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Text (Left side) */}
            <motion.div
              className="space-y-8 order-2 md:order-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#3DB2E0]/10 border border-[#3DB2E0]/30 rounded-full">
                <Activity className="w-4 h-4 text-[#3DB2E0]" />
                <span className="text-xs font-body text-[#3DB2E0] uppercase tracking-wider">La Stratégie</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#F2F2F2] leading-tight">
                Analyse avancée,<br />sans compromis.
              </h2>

              <div className="space-y-6 pt-4">
                {[
                  { icon: TrendingUp, label: 'Dénivelé', color: '#E8832A' },
                  { icon: Activity, label: 'Efficacité cardiaque', color: '#3DB2E0' },
                  { icon: Target, label: 'Performance en montée', color: '#4CAF50' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-4 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  >
                    <div
                      className="p-3 rounded-lg border transition-all group-hover:scale-110"
                      style={{ backgroundColor: `${item.color}10`, borderColor: `${item.color}30` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-lg font-heading text-[#F2F2F2]">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              className="relative order-1 md:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-[#3A3F47]/30 bg-[#0B0C10]">
                <img
                  src="https://images.unsplash.com/photo-1621361607621-aa46e79bd017?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFpbCUyMHJ1bm5pbmclMjBtb3VudGFpbiUyMHBhdGh8ZW58MXx8fHwxNzcyMzkwMzYzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Trail Analysis"
                  className="w-full aspect-square object-cover opacity-40"
                />

                {/* Dashboard Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C10]/40 via-transparent to-[#0B0C10]/80" />

                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0B0C10]/90 backdrop-blur-sm border border-[#E8832A]/30 rounded-lg p-4">
                      <div className="text-xs text-[#3A3F47] font-body mb-2">Dénivelé +</div>
                      <div className="text-3xl font-mono text-[#E8832A]">1,247m</div>
                    </div>
                    <div className="bg-[#0B0C10]/90 backdrop-blur-sm border border-[#3DB2E0]/30 rounded-lg p-4">
                      <div className="text-xs text-[#3A3F47] font-body mb-2">FC Moy</div>
                      <div className="text-3xl font-mono text-[#3DB2E0]">142 bpm</div>
                    </div>
                  </div>
                </div>

                {/* Technical Corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-[#3DB2E0]/40" />
                <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-[#3DB2E0]/40" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-[#3DB2E0]/40" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-[#3DB2E0]/40" />
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-4 bg-[#3DB2E0]/5 rounded-3xl blur-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Finale - CTA */}
      <section className="relative py-40 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E8832A]/5 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            className="relative z-10 space-y-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-heading font-bold text-[#F2F2F2] leading-tight">
              Ne laisse plus<br />ton terrain inexploré.
            </h2>

            <motion.button
              onClick={handleCTA}
              className="group relative px-14 py-5 bg-[#E8832A] text-[#0B0C10] font-heading font-bold text-lg rounded-lg overflow-hidden transition-all hover:shadow-[0_0_40px_#E8832A80]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isAuthenticated ? 'Accéder au Dashboard' : 'Se connecter'}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#E8832A] to-[#FF9D4A] opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>

            <div className="flex items-center justify-center gap-2 text-[#3A3F47] font-mono text-xs">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-[#E8832A]"
                    style={{ opacity: 1 - i * 0.3 }}
                  />
                ))}
              </div>
              <span>SYSTEM_READY</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
