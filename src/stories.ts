import data from './data/stories.json';
import {locale} from './localization';
import type {Scene, Choice, Effect} from './game';
type Texts=Record<string,string>;
type StoryEffect=Omit<Effect,'text'> & {text:Texts};
type StoryChoice=Omit<Choice,'label'|'hint'|'success'|'failure'> & {label:Texts;hint:Texts;helpHint?:Texts;success:StoryEffect;failure?:StoryEffect};
export type StoryData={kind:'start'|'random'|'ending';weight:number;title:Texts;place:Texts;text:Texts;choices:StoryChoice[]};
export const stories=data as unknown as Record<string,StoryData>;
export const storyText=(text:Texts)=>text[locale]||text.ko||'';
export function storyScene(id:string):Scene {
 const story=stories[id];
 const effect=(value:StoryEffect):Effect=>({...value,text:storyText(value.text)});
 return {id,category:'story',title:storyText(story.title),place:storyText(story.place),text:storyText(story.text),choices:story.choices.map(c=>({...c,label:storyText(c.label),hint:storyText(c.hint),success:effect(c.success),failure:c.failure?effect(c.failure):undefined}))};
}
export function pickStory(roll:number):string {
 const entries=Object.entries(stories).filter(([,s])=>s.kind==='random'&&s.weight>0),total=entries.reduce((sum,[,s])=>sum+s.weight,0);
 let cursor=roll*total;for(const [id,s]of entries){cursor-=s.weight;if(cursor<0)return id;}
 if(!entries.length)throw new Error('No active stories');return entries[entries.length-1][0];
}
