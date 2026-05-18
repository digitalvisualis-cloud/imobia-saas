'use client';

/**
 * 20 templates de post derivados do visual-lab/styles.css (CATALOGO_TEMPLATES_POSTS.md).
 * Cada um eh um wrapper fino do PostShell — diferenca visual vem do CSS .pN
 * em lab-posts.css.
 *
 * Numeracao segue o CATALOGO:
 *  01 Barra Tecnica Clean       11 Ficha Creme Horizontal
 *  02 Listing Glass Premium     12 Painel Vidro Alto Padrao
 *  03 Diagonal Modern Home      13 Galeria Lateral
 *  04 Bolhas Luxury Tour        14 Gold Label Tour
 *  05 Disponivel Dark           15 Preco Central
 *  06 Contato Soft Blur         16 Busca Contato
 *  07 Entrada Zero Impacto      17 Chamada Forte Laranja
 *  08 Faixa Amarela Vertical    18 Card Amarelo Tecnico
 *  09 Minimal Living            19 Minimal Editorial
 *  10 Dream Homes Luxury        20 Capa Carrossel Premium
 */

import type { PostTemplateProps } from './types';
import { PostShell } from './PostShell';

export const T01_BarraTecnicaClean = (p: PostTemplateProps) => <PostShell variant="p1" {...p} />;
export const T02_ListingGlassPremium = (p: PostTemplateProps) => <PostShell variant="p2" {...p} />;
export const T03_DiagonalModernHome = (p: PostTemplateProps) => <PostShell variant="p3" {...p} />;
export const T04_BolhasLuxuryTour = (p: PostTemplateProps) => <PostShell variant="p4" {...p} />;
export const T05_DisponivelDark = (p: PostTemplateProps) => <PostShell variant="p5" {...p} />;
export const T06_ContatoSoftBlur = (p: PostTemplateProps) => <PostShell variant="p6" {...p} />;
export const T07_EntradaZeroImpacto = (p: PostTemplateProps) => <PostShell variant="p7" {...p} />;
export const T08_FaixaAmarelaVertical = (p: PostTemplateProps) => <PostShell variant="p8" {...p} />;
export const T09_MinimalLiving = (p: PostTemplateProps) => <PostShell variant="p9" {...p} />;
export const T10_DreamHomesLuxury = (p: PostTemplateProps) => <PostShell variant="p10" {...p} />;
export const T11_FichaCremeHorizontal = (p: PostTemplateProps) => <PostShell variant="p11" {...p} />;
export const T12_PainelVidroAltoPadrao = (p: PostTemplateProps) => <PostShell variant="p12" {...p} />;
export const T13_GaleriaLateral = (p: PostTemplateProps) => <PostShell variant="p13" {...p} />;
export const T14_GoldLabelTour = (p: PostTemplateProps) => <PostShell variant="p14" {...p} />;
export const T15_PrecoCentral = (p: PostTemplateProps) => <PostShell variant="p15" {...p} />;
export const T16_BuscaContato = (p: PostTemplateProps) => <PostShell variant="p16" {...p} />;
export const T17_ChamadaForteLaranja = (p: PostTemplateProps) => <PostShell variant="p17" {...p} />;
export const T18_CardAmareloTecnico = (p: PostTemplateProps) => <PostShell variant="p18" {...p} />;
export const T19_MinimalEditorial = (p: PostTemplateProps) => <PostShell variant="p19" {...p} />;
export const T20_CapaCarrosselPremium = (p: PostTemplateProps) => <PostShell variant="p20" {...p} />;
