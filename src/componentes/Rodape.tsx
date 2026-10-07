import React from 'react';

import { Phone, MapPin, Clock, Instagram, Heart } from 'lucide-react';

import { LogoMarca } from './LogoMarca';

import { usarCarrinho } from '../contexto/ContextoCarrinho';

import { ExibicaoMascote } from './ExibicaoMascote';

interface PropriedadesRodape {
  onNavigateToAdmin?: () => void;
}

export const Rodape: React.FC<PropriedadesRodape> = ({ onNavigateToAdmin }) => {
  const { storeConfig } = usarCarrinho();

  return (
    <footer className="bg-[#240330] text-purple-200/80 pt-10 pb-20 md:pb-10 border-t border-purple-900/40 text-xs md:min-h-[440px] md:flex md:flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:flex-1 md:flex md:flex-col">

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-[1fr] md:items-center gap-8 mb-8 max-w-5xl mx-auto md:flex-1 w-full">

          {/* Informações da marca */}
          <div className="contents md:flex md:flex-col md:items-start md:text-left md:space-y-3">

            <LogoMarca size="lg" variant="white" className="order-1 justify-center md:justify-start" />

            <p className="order-2 text-purple-200/70 max-w-sm text-xs leading-relaxed text-center mx-auto md:mx-0 md:text-left">              {storeConfig.tagline} Preparado com ingredientes selecionados,
              frutas frescas e todo carinho para você e sua família.
            </p>

            {/* Redes sociais */}
            <div className="order-6 flex items-center justify-center md:justify-start gap-3 pt-2">

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${storeConfig.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${storeConfig.phoneFormatted}`}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <Phone className="w-5 h-5" />
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/acaiteriaalves.s/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @acaiteriaalves.s"
                className="w-11 h-11 flex items-center justify-center rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-md"
                style={{
                  background:
                    'linear-gradient(45deg, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                }}
              >
                <Instagram className="w-5 h-5" />
              </a>

            </div>
          </div>

          {/* Horário e endereço da loja */}
          <div className="order-3 space-y-2 text-center md:text-left">

            <h4 className="font-extrabold text-white text-sm">
              Atendimento
            </h4>

            <div className="space-y-2 text-xs">

              {/* Horário */}
              <div className="flex items-start justify-center md:justify-start gap-2">
                <Clock className="w-4 h-4 text-[#8ac627] shrink-0 mt-0.5" />

                <span>
                  {storeConfig.openingHours}
                </span>
              </div>

              {/* Endereço */}
              <div className="flex items-start justify-center md:justify-start gap-2">
                <MapPin className="w-4 h-4 text-[#8ac627] shrink-0 mt-0.5" />

                <a
                  href="https://www.google.com/maps/place/A%C3%A7a%C3%ADteria+Alves/@-8.7268681,-38.6873764,17z/data=!4m14!1m7!3m6!1s0x70a27001cc7b89b:0xa0f4b6ca45cf48e7!2zQcOnYcOtdGVyaWEgQWx2ZXM!8m2!3d-8.7268681!4d-38.6873764!16s%2Fg%2F11z6wrdmj6!3m5!1s0x70a27001cc7b89b:0xa0f4b6ca45cf48e7!8m2!3d-8.7268681!4d-38.6873764!16s%2Fg%2F11z6wrdmj6?hl=pt-us&entry=ttu&g_ep=EgoyMDI2MDkyOS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-inherit no-underline"
                >
                  {storeConfig.address}
                </a>
              </div>

            </div>
          </div>

          {/* Saudação do mascote */}
          <div className="order-4 flex items-center justify-center">

            <div className="text-center">

              <ExibicaoMascote size="sm" className="scale-390" />
              <span className="block text-[11px] font-bold text-white mt-1">
                Alves agradece sua visita! 💜
              </span>

            </div>
          </div>

        </div>

        {/* Barra inferior */}
        <div className="pt-6 border-t border-purple-900/30 flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 text-center text-purple-300/60 text-[11px] max-w-5xl mx-auto w-full">

          <p>
            © {new Date().getFullYear()} Açaiteria Alves. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-3">

            <p className="flex items-center gap-1">
              <span>Cardápio Digital</span>
              <span>•</span>

              <Heart className="w-3 h-3 text-[#8ac627] fill-current" />
            </p>

            {onNavigateToAdmin && (
              <>
                <span>•</span>

                <button
                  onClick={onNavigateToAdmin}
                  className="hover:text-[#8ac627] transition-colors cursor-pointer underline text-[10px]"
                >
                  Área do Administrador
                </button>
              </>
            )}

          </div>
        </div>

      </div>
    </footer>
  );
};
