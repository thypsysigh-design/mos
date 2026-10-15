const ko = require('./src/localization/ko.json');
module.exports = ({ config }) => {
  const requested = process.env.EXPO_PUBLIC_GAME_LOCALE || 'ko';
  const language = /^[a-z]{2}(?:-[A-Z]{2})?$/.test(requested) ? requested : 'ko';
  let translated = {};
  try { translated = require(`./src/localization/${language}.json`); } catch { /* Korean fallback */ }
  const name = (translated['common.app_name'] || ko['common.app_name'])
    .replace(/\{title\}/g, translated['common.title'] || ko['common.title'])
    .replace(/\{subtitle\}/g, translated['common.subtitle'] || ko['common.subtitle']);
  return { ...config, name, web: { ...config.web, name } };
};
