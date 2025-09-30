import { Button } from "../ui/button";

export default function FinalCTA(){
return <section className="py-14 border flex flex-col justify-center items-center gap-7 mb-[3rem] max-w-4xl rounded-xl mx-auto">
<p className="text-4xl font-bold">Ready to <span className="text-primary">Forge</span> Your <span className="text-primary">Knowledge?</span></p>
<Button className="text-lg" size={"lg"}>
    Sign  Up Now
</Button>
</section>
}