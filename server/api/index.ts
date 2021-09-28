import express from "express";
import { HelloQueryParams } from "../../common/HelloQueryParams";

const router = express.Router();

export default router;

router.get("/hello", (req: express.Request<any, any, any, HelloQueryParams>, res) => {

    f(req.params.name).then((r: string) => res.send(r)).catch((e: any) => {
        res.status(500);
        res.send(e.toString());
    })
})

const f = (name: string): Promise<string> => {
    const p = new Promise<string>(() => `Hello ${name}`)
    return p
}