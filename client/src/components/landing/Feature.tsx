const data = [
    {
        title:"Chat with Your Syllabus",
        desc:"Have a question? Ask our integrated AI chat for instant, context-aware answers directly from your documents"
    },
    {
        title:"Fair and Focused Learning",
        desc:"Ensure a focused study environment with fullscreen mode, tab-switching warnings, and other anti-cheat features"
    },
    {
        title:"Learn from Your Mistakes",
        desc:"Get immediate feedback with a score breakdown, correct/incorrect answers, and AI-generated explanations"
    },
]
export default function Feature(){
    return <section className="flex flex-col justify-center items-center mt-[5rem] mb-[3rem] space-y-6">
    <div className="text-4xl font-bold ">
        A Smarter Way to <span className="text-primary">Study</span>
    </div>
    <div className="flex px-20 justify-center gap-3 mb-3 ">
        {
            data.map((v,i)=>{
                return <div key={i} className="border p-5 space-y-2 rounded-2xl ">
                    <p className="text-2xl font-bold">{v.title}</p>
                    <p className="text-base">{v.desc}</p>
                </div>
            })
        }
    </div>
    </section>
}