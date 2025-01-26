import { User } from "../models/user.model.js";
import { fetchFromTMDB } from "../services/tmdb.service.js";

export async function searchPerson(req, res) {
    const { query } = req.params;
    try {
        const response = await fetchFromTMDB(
            `https://api.themoviedb.org/3/search/person?query=${query}&include_adult=false&language=en-US&page=1`
        );

        if(response.results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No results found",
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $push: {
                searchHistory: {
                    id: response.results[0].id,
                    image: response.results[0].profile_path,
                    title: response.results[0].name,
                    searchType: "person",
                    createdAt: new Date(),
                },
            },
        });
        res.status(200).json({
            success: true,
            content: response.results,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in searchPerson: " + error.message,
        });
    }
}
export async function searchMovie(req, res) {
    const { query } = req.params;
    try {
        const response = await fetchFromTMDB(
            `https://api.themoviedb.org/3/search/movie?query=${query}&include_adult=false&language=en-US&page=1`
        );

        if(response.results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No results found",
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $push: {
                searchHistory: {
                    id: response.results[0].id,
                    image: response.results[0].poster_path,
                    title: response.results[0].title,
                    searchType: "movie",
                    createdAt: new Date(),
                },
            },
        });
        res.status(200).json({
            success: true,
            content: response.results,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in searchMovie: " + error.message,
        });
    }
}
export async function searchTV(req, res) {
    const { query } = req.params;
    try {
        const response = await fetchFromTMDB(
            `https://api.themoviedb.org/3/search/tv?query=${query}&include_adult=false&language=en-US&page=1`
        );

        if(response.results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No results found",
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $push: {
                searchHistory: {
                    id: response.results[0].id,
                    image: response.results[0].poster_path,
                    title: response.results[0].name,
                    searchType: "tv",
                    createdAt: new Date(),
                },
            },
        });
        res.status(200).json({
            success: true,
            content: response.results,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in searchTV: " + error.message,
        });
    }
}

export async function getSearchHistory(req, res) {
    try {
        //const user = await User.findById(req.user._id);
        res.status(200).json({
            success: true,
            searchHistory: req.user.searchHistory,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in getSearchHistory: " + error.message,
        });
    }
}


export async function removeItemFromSearchHistory(req, res) {
    let { id } = req.params;
    try {
        id = parseInt(id);
        await User.findByIdAndUpdate(req.user._id, {
            $pull: {
                searchHistory: {
                    id: id,
                },
            },
        });
        res.status(200).json({
            success: true,
            message: "Item removed from search history",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in removeItemFromSearchHistory: " + error.message,
        });
        
    }
}