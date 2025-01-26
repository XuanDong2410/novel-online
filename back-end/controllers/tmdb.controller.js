import { fetchFromTMDB } from '../services/tmdb.service.js';
export async function getTrending(req, res) {
    const { type } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/trending/${type}/day?language=en-US`);
        const random = data.results[Math.floor(Math.random() * data.results?.length)];

        res.status(200).json({
            success: true,
            content: random,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
export async function getTrailers(req, res) {
    try {
        const { type, id } = req.params;
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/${type}/${id}/videos?language=en-US`);
        res.status(200).json({
            success: true,
            trailers: data.results,
        });
    } catch (error) {
        if(error.message.includes("404")) {
            return res.status(404).send(null);
        }
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
export async function getDetails(type, req, res) {
    const { id } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/${type}/${id}?language=en-US`);
        res.status(200).json({
            success: true,
            content: data,
        });
    } catch (error) {
        if(error.message.includes("404")) {
            return res.status(404).send(null);
        }
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
export async function getSimilars(type, req, res) {
    const { id } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/${type}/${id}/similar?language=en-US&page=1`);
        res.status(200).json({
            success: true,
            similar: data.results,
        });
    } catch (error) {
        if(error.message.includes("404")) {
            return res.status(404).send(null);
        }
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
export async function getByCategory(type, req, res) {
    const { category } = req.params;
    try {
        const data = await fetchFromTMDB(`https://api.themoviedb.org/3/${type}/${category}?language=en-US&page=1`);
        res.status(200).json({
            success: true,
            content: data.results,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
