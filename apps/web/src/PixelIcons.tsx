import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
const paths = {
  ArrowRight: 'M2 7h9V5H9V3h2v2h2v2h2v2h-2v2h-2v2H9v-2h2V9H2z',
  ChevronRight: 'M5 2h2v2h2v2h2v4H9v2H7v2H5v-2h2v-2h2V6H7V4H5z',
  ChevronDown: 'M2 5h2v2h2v2h4V7h2V5h2v4h-2v2h-2v2H6v-2H4V9H2z',
  Plus: 'M7 2h2v5h5v2H9v5H7V9H2V7h5z',
  X: 'M2 2h2v2h2v2h4V4h2V2h2v2h-2v2h-2v4h2v2h2v2h-2v-2h-2v-2H6v2H4v2H2v-2h2v-2h2V6H4V4H2z',
  Check: 'M2 7h2v2h2v2h2V9h2V7h2V5h2V3h2v4h-2v2h-2v2h-2v2H6v-2H4V9H2z',
  CheckCheck: 'M0 7h2v2h2v2h2V9h2V7h2V5h2V3h2v4h-2v2h-2v2H8v2H4v-2H2V9H0zm10 4h2V9h2V7h2v4h-2v2h-4z',
  Folder: 'M1 3h6v2h8v9H1zm2 4v5h10V7z',
  Layers: 'M3 1h8v2h2v10h-2V3H3zm-2 4h2v10h10v-2h2v4H1zm4 0h4v2H5zm0 4h4v2H5z',
  BookOpen: 'M1 2h5v1h4V2h5v12h-5v1H6v-1H1zm2 2v8h3v1h1V5H6V4zm6 1v8h1v-1h3V4h-3v1z',
  LayoutDashboard: 'M1 1h6v6H1zm2 2v2h2V3zm6-2h6v6H9zm2 2v2h2V3zM1 9h6v6H1zm2 2v2h2v-2zm6-2h6v6H9zm2 2v2h2v-2z',
  Play: 'M3 1h2v2h3v2h3v2h3v2h-3v2H8v2H5v2H3z',
  Clock3: 'M4 0h8v2h2v2h2v8h-2v2h-2v2H4v-2H2v-2H0V4h2V2h2zm0 3H3v1H2v8h2v2h8v-2h2V4h-2V2H4zm3 1h2v4h3v2H7z',
  Pencil: 'M11 0h2v2h2v2h-2v2h-2V4H9V2h2zM7 4h2v2h2v2H9v2H7v2H5v2H1v-4h2V8h2V6h2z',
  ListOrdered: 'M1 1h2v4H1zm4 0h10v2H5zm0 5h10v2H5zm0 5h10v2H5zM0 6h3v3H2V8H0zm0 5h3v4H0v-1h2v-1H0z',
  ExternalLink: 'M8 0h8v8h-2V4h-2v2h-2v2H8v2H6V8h2V6h2V4h2V2H8zM1 3h5v2H3v8h8v-3h2v5H1z',
  Trash2: 'M5 1h6v2h4v2H1V3h4zM3 6h2v7h6V6h2v9H3zm4 0h2v5H7z',
  Eye: 'M4 3h8v2h2v2h2v2h-2v2h-2v2H4v-2H2V9H0V7h2V5h2zm0 3H3v1H2v2h2v2h8V9h2V7h-2V5H4zm2 0h4v4H6z',
  RefreshCw: 'M4 1h7v2h2V1h2v6H9V5h3V4h-2V3H5v2H3v3H1V4h2V2h1zM1 9h6v2H4v1h2v1h5v-2h2V8h2v4h-2v2h-2v1H4v-2H3v2H1z',
};
function icon(name: keyof typeof paths) {
  return function PixelIcon({ size = 18, ...props }: IconProps) {
    return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" {...props}><path d={paths[name]} fillRule="evenodd"/></svg>;
  };
}
export const ArrowRight = icon('ArrowRight'), ChevronRight = icon('ChevronRight'), ChevronDown = icon('ChevronDown');
export const Plus = icon('Plus'), X = icon('X'), Check = icon('Check'), CheckCheck = icon('CheckCheck');
export const Folder = icon('Folder'), Layers = icon('Layers'), BookOpen = icon('BookOpen'), LayoutDashboard = icon('LayoutDashboard');
export const Play = icon('Play'), Clock3 = icon('Clock3'), Pencil = icon('Pencil'), ListOrdered = icon('ListOrdered');
export const ExternalLink = icon('ExternalLink'), Trash2 = icon('Trash2'), Eye = icon('Eye'), RefreshCw = icon('RefreshCw');
