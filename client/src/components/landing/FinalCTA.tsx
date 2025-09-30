import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";

export default function FinalCTA(){
return <section className="py-14 border flex flex-col justify-center items-center text-center gap-7 mb-[3rem] max-w-xl lg:max-w-4xl  rounded-xl mx-auto ">
<p className="text-4xl font-bold">Ready to <span className="text-primary">Forge</span> Your <span className="text-primary">Knowledge?</span></p>
<Link to="/signup">

<Button className="text-lg" size={"lg"}>
    Sign  Up Now
</Button>
</Link>
</section>
}