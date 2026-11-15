// State travels with a daily game so reloading does not change the next refill.
export function seededRandom(seed){
 const random=()=>{random.state=(Math.imul(1664525,random.state)+1013904223)>>>0;return random.state/4294967296;};
 random.state=seed>>>0;return random;
}
