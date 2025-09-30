import { FileIcon, Settings, Trophy } from "lucide-react"

const WorkData = [
  {
    name: 'Upload',
    icon: <FileIcon size={30} />,
    header: 'Upload Your Syllabus',
    desc: 'Drag and drop any PDF or DOC file. Our AI gets to work instantly',
  },
  {
    name: 'Customize',
    icon: <Settings size={30} />,
    header: 'Tailor Your Quiz',
    desc: 'Choose your format multiple choice, true/false, or short answer. Set the difficulty and length',
  },
  {
   
    name: 'Conquer',
    icon: <Trophy size={30} />,
    header: 'Start Learning',
    desc: 'Take your custom quiz, track your progress with detailed analytics, and master your material.',
  },
]
export default function Works() {
  return (
    <section className="flex flex-col justify-center items-center gap-7 mt-[5rem] font-geist pb-3">
      <div className="font-bold text-4xl">
        How It <span className="text-primary">Works?</span>
      </div>
      <div className="space-y-6">
        {WorkData.map((v, i) => {
          return (
            <div key={i} className="   flex space-x-6">
              <div className=' flex items-center'>
                <div className="flex flex-col items-center bg-primary rounded-full w-[6rem] h-[6rem] justify-center font-bold ">
               <div className=" text-white dark:text-foreground">
                 {v.icon}
               </div>
                <p className="text-white dark:text-foreground">{v.name}</p>
              </div>
              </div>
              <div className=" space-y-2 p-5 w-full flex justify-center flex-col border rounded-2xl">
                <p className="text-2xl font-bold">{v.header}</p>
                <p className='text-base'>{v.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}