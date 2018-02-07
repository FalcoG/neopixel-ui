export default class Generate{
  static hex(value){
    value = value.toString(16);
    return (value.length === 1) ? '0' + value : value;
  }

  static gradient(startColor, endColor, ratio){
    const r = Math.ceil(parseInt(endColor.substring(0,2), 16) * ratio + parseInt(startColor.substring(0,2), 16) * (1-ratio));
    const g = Math.ceil(parseInt(endColor.substring(2,4), 16) * ratio + parseInt(startColor.substring(2,4), 16) * (1-ratio));
    const b = Math.ceil(parseInt(endColor.substring(4,6), 16) * ratio + parseInt(startColor.substring(4,6), 16) * (1-ratio));

    return `#${this.hex(r) + this.hex(g) + this.hex(b)}`;
  }

  static ripple(primaryColor, secondaryColor, index){
    return `#${index % 2 === 0 ? primaryColor : secondaryColor}`;
  }

  static randomColor(){
    // return ((1<<24)*Math.random()|0).toString(16);
    // return (Math.random() * 0xFFFFFF << 0).toString(16);

    const chars = '0123456789ABCDEF';

    let length = 6;
    let hex = '';

    while(length--) hex += chars[(Math.random() * 16) | 0];

    return hex;
  }
}