import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const files = walk(root).filter((file) => file.endsWith('.tsx'));

const neutralText = /text-(?:slate|neutral|gray|zinc)-\d+(?:\/\d+)?/g;
const neutralBackground = /bg-(?:slate|neutral|gray|zinc)-\d+(?:\/\d+)?/g;
const neutralBorder = /border-(?:slate|neutral|gray|zinc)-\d+(?:\/\d+)?/g;
const darkNeutralText = /dark:text-(?:slate|neutral|gray|zinc)-\d+(?:\/\d+)?/g;
const darkNeutralBackground = /dark:bg-(?:slate|neutral|gray|zinc)-\d+(?:\/\d+)?/g;
const darkNeutralBorder = /dark:border-(?:slate|neutral|gray|zinc)-\d+(?:\/\d+)?/g;

const spacingMap = new Map([
  ['0.5', '1'],
  ['1.5', '2'],
  ['2.5', '2'],
  ['3', '4'],
  ['3.5', '4'],
  ['4.5', '4'],
  ['5', '6'],
  ['7', '6'],
  ['8', '12'],
  ['9', '12'],
  ['10', '12'],
  ['11', '12'],
  ['14', '12'],
  ['16', '20'],
  ['24', '20'],
  ['28', '20'],
  ['32', '20'],
  ['36', '20'],
  ['40', '20'],
  ['44', '20'],
  ['48', '20'],
  ['52', '20'],
  ['56', '20'],
  ['60', '20'],
  ['64', '20'],
  ['72', '20'],
  ['80', '20'],
  ['96', '20'],
]);

for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');

  source = source
    .replaceAll('font-extrabold', 'font-semibold')
    .replaceAll('font-bold', 'font-semibold')
    .replaceAll('font-medium', 'font-normal')
    .replaceAll('font-display', 'font-sans')
    .replaceAll('uppercase', '')
    .replaceAll('tracking-widest', 'tracking-normal')
    .replaceAll('tracking-wider', 'tracking-normal')
    .replaceAll('rounded-[40px]', 'rounded-lg')
    .replaceAll('rounded-3xl', 'rounded-lg')
    .replaceAll('rounded-2xl', 'rounded-lg')
    .replaceAll('rounded-xl', 'rounded-lg')
    .replaceAll('rounded-full', 'rounded-lg')
    .replace(/\brounded(?=\s|["'`])/g, 'rounded-sm')
    .replace(/text-\[(?:8|9|10|11)px\]/g, 'text-xs')
    .replaceAll('bg-brand', 'bg-primary')
    .replaceAll('text-brand', 'text-primary')
    .replaceAll('border-brand', 'border-primary')
    .replaceAll('from-brand', 'from-primary')
    .replaceAll('to-brand', 'to-primary')
    .replaceAll('via-brand', 'via-primary')
    .replaceAll('ring-brand', 'ring-primary')
    .replaceAll('shadow-brand', 'shadow-primary')
    .replaceAll('bg-accent', 'bg-coral')
    .replaceAll('text-accent', 'text-coral')
    .replaceAll('border-accent', 'border-coral')
    .replaceAll('from-accent', 'from-coral')
    .replaceAll('to-accent', 'to-coral')
    .replaceAll('via-accent', 'via-coral')
    .replaceAll('bg-white', 'bg-warmWhite')
    .replaceAll('text-white', 'text-warmWhite')
    .replaceAll('border-white', 'border-warmWhite')
    .replaceAll('from-white', 'from-warmWhite')
    .replaceAll('to-white', 'to-warmWhite')
    .replaceAll('bg-black', 'bg-textPrimary')
    .replaceAll('text-black', 'text-textPrimary');

  source = source
    .replace(darkNeutralText, 'dark:text-dark-text-muted')
    .replace(darkNeutralBackground, 'dark:bg-dark-card')
    .replace(darkNeutralBorder, 'dark:border-dark-border')
    .replace(neutralText, 'text-textSecondary')
    .replace(neutralBackground, 'bg-stoneMuted')
    .replace(neutralBorder, 'border-stoneMuted');

  const colorGroups = [
    ['(?:blue|sky|indigo)', 'primary'],
    ['(?:red|rose|pink|purple)', 'coral'],
    ['(?:green|emerald|teal|lime)', 'successSage'],
    ['(?:amber|orange|yellow)', 'warningAmber'],
  ];

  for (const [group, token] of colorGroups) {
    for (const utility of ['bg', 'text', 'border', 'from', 'to', 'via', 'ring']) {
      source = source.replace(
        new RegExp(`${utility}-${group}-\\d+(\\/\\d+)?`, 'g'),
        (_, opacity = '') => `${utility}-${token}${opacity}`,
      );
    }
    for (const utility of ['bg', 'text', 'border', 'from', 'to', 'via', 'ring']) {
      source = source.replace(
        new RegExp(`dark:${utility}-${group}-\\d+(\\/\\d+)?`, 'g'),
        (_, opacity = '') => `dark:${utility}-${token}${opacity}`,
      );
    }
  }

  source = source.replace(
    /\b(-?(?:p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy]))-(4\.5|3\.5|2\.5|1\.5|0\.5|96|80|72|64|60|56|52|48|44|40|36|32|28|24|16|14|11|10|9|8|7|5|3)\b/g,
    (match, utility, value) => `${utility}-${spacingMap.get(value)}`,
  );

  source = source
    .replace(/rounded-sm-(sm|md|lg)/g, 'rounded-$1')
    .replaceAll('rounded-sm-sm', 'rounded-sm')
    .replaceAll('primary-600', 'primary')
    .replaceAll('coral-600', 'coral')
    .replaceAll('-left-[32px]', '-left-6')
    .replaceAll('-left-[35px]', '-left-12')
    .replaceAll('-left-[51px]', '-left-12')
    .replaceAll('-left-[6px]', '-left-2')
    .replaceAll('py-[2px]', 'py-1');

  fs.writeFileSync(file, source);
}
