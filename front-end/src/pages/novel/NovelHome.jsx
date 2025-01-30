// import axios from "axios"
//  import { useState } from "react"
import { useQuery} from "@tanstack/react-query"

import Navbar from "../../components/Navbar";
const NovelHome = () => {
    // const [novel, setNovels] = useState([])
    // const queryClient = useQueryClient()

    const {data} = useQuery({
        queryKey: ['novels'],
        queryFn: async () => {             // clear the existing data before fetching new data
            try {
                const res = await fetch(`/api/v1/novels`)                
                const data = await res.json()
                return data.novels
            } catch (error) {
                if(error.message.includes('404')){
                    return []
                }
            }
        },
    })
    return <div className="bg-black min-h-screen text-white">
        <div className="mx-auto container px-4 py-8 h-full">
            <Navbar />
            <h1 className="text-3xl font-bold mb-8">Novel Home</h1>
            {/* movie details */}    
            <div className="flex flex-col md:flex-row items-center justify-between gap-20 max-w-6xl mx-auto">
                <div className="mb-4 md:mb-0">
                    <h2 className="text-5xl font-bold text-balance">
                        {data.novels}
                    </h2>
                    {/* <p className="mt-4 text-lg">{novel?.description}</p> */}
                </div>
                {/* <img 
                    src={ORIGINAL_IMG_BASE_URL + content?.poster_path} 
                    alt="Poster image" 
                    className="max-h-[600px] rounded-md"
                /> */}
            </div>
    </div>
</div>
}

export default NovelHome