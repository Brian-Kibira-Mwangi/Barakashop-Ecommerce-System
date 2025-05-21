const { default: axios } = require("axios");

const axiosClient = axios.create({
  baseURL: "http://localhost:1337/api",
});

const getInventory = async () => {
  let page = 1;
  let pageSize = 100; // Strapi default page size
  let allItems = [];
  let totalItems = null; // Store total count from meta
  let hasMore = true;

  while (hasMore) {
    const response = await axiosClient.get(
      `/inventories?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`
    );

    console.log(`Response for Page ${page}:`, response.data);

    // Extract data and total count
    const fetchedData = response.data.data;

    if (totalItems === null && response.data.meta) {
      totalItems = response.data.meta.total; // Set totalItems once from meta
    }

    if (Array.isArray(fetchedData) && fetchedData.length > 0) {
      allItems = [...allItems, ...fetchedData];
      page++;

      // Stop if we've fetched all available items
      if (allItems.length >= totalItems) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log("Fetched All Inventory Items:", allItems.length);
  return allItems;
};

const getSliders = () =>
  axiosClient.get("/image-sliders?populate=*").then((resp) => {
    console.log("Fetched Sliders:", resp.data.data);
    return resp.data.data;
  });

  const getProfile = (token) =>
    axiosClient
      .get("/users/me?populate=*", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((resp) => {
        console.log("Fetched User Profile:", resp.data);
        return resp.data;
      })
      .catch((err) => console.error("Error fetching profile:", err));
  
const getCategory = () => axiosClient.get("/brands?populate=*");

const getCategoryList = () =>
  axiosClient.get("/brands?populate=*").then((resp) => {
    return resp.data.data;
  });

const getProductsByCategory = (category) =>
  axiosClient
    .get("/brands?filters[Brand][$in]=" + category + "&populate=*")
    .then((resp) => {
      return resp.data.data;
    });

    const getModels = async () => {
      let page = 1;
      let pageSize = 100; // Adjust as needed
      let allModels = [];
      let totalItems = null;
      let hasMore = true;
    
      while (hasMore) {
        const response = await axiosClient.get(
          `/models?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`
        );
    
        console.log(`Fetched Models - Page ${page}:`, response.data);
    
        const fetchedData = response.data.data;
    
        if (totalItems === null && response.data.meta) {
          totalItems = response.data.meta.total;
        }
    
        if (Array.isArray(fetchedData) && fetchedData.length > 0) {
          allModels = [...allModels, ...fetchedData];
          page++;
    
          if (allModels.length >= totalItems) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    
      console.log("Fetched All Models:", allModels.length);
      return allModels;
    };
    
    const getFilteredModels = async (category) => {
  try {
    if (!category || (Array.isArray(category) && category.length === 0)) {
      console.warn("⚠️ No category provided for filtering.");
      return [];
    }

    // Handle single string or array of categories
    const categoryValue = Array.isArray(category) ? category : [category];
    const categoryFilter = categoryValue.map(encodeURIComponent).join(',');

    let page = 1;
    const pageSize = 100;
    let allFilteredModels = [];
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `/models?filters[Brand][$in]=${categoryFilter}&pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`;
        console.log("Request URL:", url);
        
        const response = await axiosClient.get(url);

        if (!response.data || !Array.isArray(response.data.data)) {
          throw new Error("Invalid API response structure");
        }

        const fetchedData = response.data.data;
        allFilteredModels = [...allFilteredModels, ...fetchedData];

        // Pagination check
        const totalItems = response.data.meta?.pagination?.total || 0;
        if (allFilteredModels.length >= totalItems || fetchedData.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        hasMore = false;
        throw error;
      }
    }

    return allFilteredModels;
  } catch (error) {
    console.error("Error in getFilteredModels:", error);
    throw error;
  }
}
const getSearchedModels = (searchTerm) => {
  return axiosClient
    .get(
      `/models?filters[$or][0][Brand][Brand][$containsi]=${searchTerm}` +
        `&filters[$or][1][Modelname][Color_name][$containsi]=${searchTerm}` +
        `&filters[$or][2][Name][$containsi]=${searchTerm}` +
        `&filters[$or][3][Features][$containsi]=${searchTerm}`
    )
    .then((resp) => {
      console.log("Fetched models:", resp.data.data);
      return resp.data.data;
    })
    .catch((err) => console.error("Error fetching models:", err));
};

const getColorDetails = async () => {
  let page = 1;
  const pageSize = 100; // Adjust if needed
  let allColors = [];
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await axiosClient.get(
        `/colors?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`
      );

      console.log(`Response for Page ${page}:`, response.data);

      const fetchedData = response.data?.data || [];

      if (fetchedData.length > 0) {
        allColors = [...allColors, ...fetchedData];
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log("Fetched All Color Variants:", allColors.length);
    return allColors;
  } catch (error) {
    console.error("Error fetching colors:", error);
    return []; // Return empty array on failure
  }
};

const registerUser = (
  email,
  firstName,
  lastName,
  userName,
  password,
  confirmPassword,
  phoneNumber
) =>
  axiosClient.post("/customers", {
    Email: email,
    Firstname: firstName,
    Lastname: lastName,
    Username: userName,
    Password: password,
    Phonenumber: phoneNumber,
  });

export default {
  getCategory,
  getSliders,
  getCategoryList,
  getModels,
  getFilteredModels,
  getColorDetails,
  getInventory,
  getSearchedModels,
  getProductsByCategory,
  getProfile,
  registerUser,
};


