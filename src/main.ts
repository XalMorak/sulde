import "./style.css";
import { Game } from "./game/Game";

const canvas = document.getElementById("view") as HTMLCanvasElement;
new Game(canvas);
