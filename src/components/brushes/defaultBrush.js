export const defaultBrush=(ctx,{start,end,color,size})=>{
    ctx.strokeStyle=color;
    ctx.lineWidth=size;
    ctx.lineCap='round';
    ctx.lineJoin='round';

    ctx.beginPath();
    ctx.moveTo(start.x,start.y);
    ctx.lineTo(end.x,end.y);
    ctx.stroke();
};