import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

// Helper to upload a file to S3 and return the URL
async function uploadToS3(file, token) {
  const presignRes = await fetch(`${backendUrl}/api/upload/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ fileType: file.type }),
  });
  if (!presignRes.ok) throw new Error('Failed to get S3 pre-signed URL');
  const { uploadUrl, fileUrl } = await presignRes.json();
  const s3Res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file,
  });
  if (!s3Res.ok) throw new Error('Failed to upload file to S3');
  return fileUrl;
}

const Add = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);
  const [video, setVideo] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capital, setCapital] = useState("");
  const [additionalCapital, setAdditionalCapital] = useState({
    type: "fixed",
    value: "",
  });
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [bestseller, setBestseller] = useState(false);
  const [discount, setDiscount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState("");
  const [weight, setWeight] = useState("");
  const [vat, setVat] = useState("");
  const [variations, setVariations] = useState([
    {
      name: "",
      options: [
        {
          name: "",
          priceAdjustment: undefined,
          quantity: undefined,
          sku: "",
        },
      ],
    },
  ]);
  const [variationError, setVariationError] = useState(false);

  // Fetch token from local storage
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
    } else {
      alert("No authentication token found. Please log in again.");
    }
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/categories`);
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategory(response.data[0].name);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleImageChange = (file, setImage) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Only JPG and PNG formats are allowed");
      return;
    }
    setImage(file);
  };

  const handleVideoChange = (file) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert("Video size should be less than 100MB");
      return;
    }
    if (!["video/mp4", "video/avi", "video/mkv"].includes(file.type)) {
      alert("Only MP4, AVI, and MKV formats are allowed");
      return;
    }
    setVideo(file);
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    setPrice(value === "" ? "" : Math.max(0, parseFloat(value) || 0));
  };

  const handleCapitalChange = (e) => {
    const value = e.target.value;
    setCapital(value === "" ? "" : Math.max(0, parseFloat(value) || 0));
  };

  const handleAdditionalCapitalChange = (e) => {
    const value = e.target.value;
    setAdditionalCapital((prev) => ({
      ...prev,
      value: value === "" ? "" : Math.max(0, parseFloat(value) || 0),
    }));
  };

  const handleAdditionalCapitalTypeChange = (type) => {
    setAdditionalCapital((prev) => ({
      ...prev,
      type,
    }));
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    setQuantity(value === "" ? "" : Math.max(0, parseInt(value, 10) || 0));
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    setDiscount(value === "" ? "" : Math.max(0, parseFloat(value) || 0));
  };

  const handleVatChange = (e) => {
    const value = e.target.value;
    setVat(value === "" ? "" : Math.max(0, parseFloat(value) || 0));
  };

  const handleWeightChange = (e) => {
    const value = e.target.value;
    setWeight(value === "" ? "" : Math.max(0, parseFloat(value) || 0));
  };

  // Variation handlers
  const addVariation = () => {
    setVariations((prev) => [
      ...prev,
      {
        name: "",
        options: [
          {
            name: "",
            priceAdjustment: undefined,
            quantity: undefined,
            sku: "",
          },
        ],
      },
    ]);
    setVariationError(false);
  };

  const removeVariation = (index) => {
    if (variations.length <= 1) {
      alert("You must have at least one variation");
      return;
    }
    setVariations((prev) => prev.filter((_, i) => i !== index));
    setVariationError(false);
  };

  const addOption = (variationIndex) => {
    setVariations((prev) => {
      const newVariations = [...prev];
      newVariations[variationIndex].options.push({
        name: "",
        priceAdjustment: undefined,
        quantity: undefined,
        sku: "",
      });
      return newVariations;
    });
    setVariationError(false);
  };

  const removeOption = (variationIndex, optionIndex) => {
    if (variations[variationIndex].options.length <= 1) {
      alert("Each variation must have at least one option");
      return;
    }
    setVariations((prev) => {
      const newVariations = [...prev];
      newVariations[variationIndex].options = newVariations[
        variationIndex
      ].options.filter((_, i) => i !== optionIndex);
      return newVariations;
    });
    setVariationError(false);
  };

  const handleVariationChange = (index, value) => {
    setVariations((prev) => {
      const newVariations = [...prev];
      newVariations[index].name = value;
      return newVariations;
    });
    setVariationError(false);
  };

  const handleOptionChange = (variationIndex, optionIndex, field, value) => {
    setVariations((prev) => {
      const newVariations = [...prev];
      newVariations[variationIndex].options[optionIndex][field] =
        field === "priceAdjustment" || field === "quantity"
          ? Number(value)
          : value;
      return newVariations;
    });
    setVariationError(false);
  };

  const calculateTotalQuantity = () => {
    return variations.reduce((total, variation) => {
      return (
        total +
        variation.options.reduce((sum, option) => sum + (option.quantity || 0), 0)
      );
    }, 0);
  };

  const validateProduct = () => {
    const errors = [];

    // Basic field validation
    if (!name.trim()) errors.push("Product name is required");
    if (!description.trim()) errors.push("Product description is required");
    if (!category) errors.push("Product category is required");
    
    // Price validation
    if (isNaN(price) || price <= 0) errors.push("Price must be greater than 0");
    if (isNaN(discount) || discount < 0 || discount > 100) errors.push("Discount must be between 0 and 100");
    
    // Capital validation
    if (isNaN(capital) || capital < 0) errors.push("Capital must be a non-negative number");
    if (isNaN(vat) || vat < 0) errors.push("VAT must be a non-negative number");
    
    // Weight validation
    if (isNaN(weight) || weight <= 0) errors.push("Weight must be greater than 0");

    // Image validation
    if (!image1) errors.push("At least one product image is required");
    
    // Variation validation
    if (variations.length === 0) {
      errors.push("At least one variation is required");
    } else {
      const variationErrors = validateVariations();
      if (variationErrors.length > 0) {
        errors.push(...variationErrors);
      }
    }

    return errors;
  };

  const validateVariations = () => {
    const errors = [];
    const MAX_VARIATIONS = 5;
    const MAX_OPTIONS = 10;

    if (variations.length > MAX_VARIATIONS) {
      errors.push(`Maximum ${MAX_VARIATIONS} variations allowed`);
      return errors;
    }

    for (const [index, variation] of variations.entries()) {
      if (!variation.name.trim()) {
        errors.push(`Variation ${index + 1} name is required`);
      }

      if (variation.options.length === 0) {
        errors.push(`Variation ${index + 1} must have at least one option`);
      } else if (variation.options.length > MAX_OPTIONS) {
        errors.push(`Variation ${index + 1} cannot have more than ${MAX_OPTIONS} options`);
      }

      for (const [optionIndex, option] of variation.options.entries()) {
        if (!option.name.trim()) {
          errors.push(`Option ${optionIndex + 1} in variation ${index + 1} must have a name`);
        }
        if (isNaN(option.priceAdjustment)) {
          errors.push(`Option ${optionIndex + 1} in variation ${index + 1} must have a valid price adjustment`);
        }
        if (isNaN(option.quantity) || option.quantity < 0) {
          errors.push(`Option ${optionIndex + 1} in variation ${index + 1} must have a valid quantity`);
        }
      }
    }

    return errors;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setVariationError(false);

    if (!token) {
      toast.error("Authentication failed. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    // Validate all fields
    const validationErrors = validateProduct();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Upload images to S3 and collect URLs
      const imageFiles = [image1, image2, image3, image4].filter(Boolean);
      const imageUrls = [];
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) throw new Error('Image size should be less than 5MB');
        imageUrls.push(await uploadToS3(file, token));
      }
      // 2. Upload video to S3 (if present)
      let videoUrl = null;
      if (video) {
        if (video.size > 50 * 1024 * 1024) throw new Error('Video size should be less than 50MB');
        videoUrl = await uploadToS3(video, token);
      }
      // 3. Prepare product data
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        additionalCapital: JSON.stringify(additionalCapital),
        vat: Number(vat),
        capital: Number(capital),
        quantity: calculateTotalQuantity(),
        category,
        bestseller: bestseller ? "true" : "false",
        discount: Number(discount),
        weight: Number(weight),
        variations: JSON.stringify(variations),
        images: imageUrls,
        video: videoUrl,
      };
      // Debug log
      console.log("Sending productData to backend:", productData);
      // 4. Send product data to backend
      const response = await axios.post(`${backendUrl}/api/product/add`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.data.success) {
        toast.success("Product added successfully!");
        // Reset form or redirect
      } else {
        throw new Error(response.data.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Failed to add product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const baseAmount = parseFloat(capital) || 0;

    let additionalAmount = 0;
    if (additionalCapital.value) {
      if (additionalCapital.type === "percent") {
        additionalAmount =
          baseAmount * (parseFloat(additionalCapital.value) / 100);
      } else {
        additionalAmount = parseFloat(additionalCapital.value) || 0;
      }
    }

    const totalBeforeVat = baseAmount + additionalAmount;
    const vatAmount = totalBeforeVat * ((parseFloat(vat) || 0) / 100);
    const computedPrice = totalBeforeVat + vatAmount;

    setPrice(computedPrice.toFixed(2));
  }, [capital, additionalCapital, vat]);

  return (
    <form
      onSubmit={onSubmitHandler}
      className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-sm"
    >
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Add New Product</h2>
      
      {/* Image Upload */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-gray-700">Product Images (Max 4)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[image1, image2, image3, image4].map((image, index) => (
            <label
              key={index}
              htmlFor={`image${index + 1}`}
              className="relative cursor-pointer group"
            >
              <div className="flex items-center justify-center overflow-hidden transition-colors border-2 border-gray-300 border-dashed rounded-lg aspect-square bg-gray-50 hover:border-indigo-300">
                <img
                  className="object-cover w-full h-full"
                  src={image ? URL.createObjectURL(image) : assets.upload_area}
                  alt={image ? `Preview ${index + 1}` : `Upload ${index + 1}`}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 group-hover:bg-opacity-10">
                {!image && (
                  <span className="text-xs text-gray-500">Click to upload</span>
                )}
              </div>
              <input
                onChange={(e) =>
                  handleImageChange(
                    e.target.files[0],
                    [setImage1, setImage2, setImage3, setImage4][index]
                  )
                }
                type="file"
                id={`image${index + 1}`}
                hidden
              />
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: JPG, PNG (Max 5MB each)
        </p>
      </div>

      {/* Video Upload */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Product Video (Optional)
        </label>
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleVideoChange(e.target.files[0])}
                accept="video/mp4,video/avi,video/mkv"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </label>
          {video && (
            <button
              type="button"
              onClick={() => setVideo(null)}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        {video && (
          <div className="mt-3">
            <video controls className="max-w-xs border rounded-lg">
              <source src={URL.createObjectURL(video)} type={video.type} />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: MP4, AVI, MKV (Max 100MB)
        </p>
      </div>

      {/* Product Information */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Product Name *
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            type="text"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Weight (kg) *
          </label>
          <input
            onChange={handleWeightChange}
            value={weight}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            type="number"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="flex items-end">
          <div className="flex items-center h-10">
            <input
              id="bestseller"
              name="bestseller"
              type="checkbox"
              checked={bestseller}
              onChange={() => setBestseller((prev) => !prev)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label
              htmlFor="bestseller"
              className="block ml-2 text-sm text-gray-700"
            >
              Mark as Bestseller
            </label>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="grid grid-cols-1 gap-6 p-4 mb-6 rounded-lg md:grid-cols-2 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800 md:col-span-2">
          Pricing Information
        </h3>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Capital Cost *
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{currency}</span>
            </div>
            <input
              onChange={handleCapitalChange}
              value={capital}
              className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Sales Margin *
          </label>
          <div className="flex gap-2">
            <select
              value={additionalCapital.type}
              onChange={(e) => handleAdditionalCapitalTypeChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="fixed">{currency}</option>
              <option value="percent">%</option>
            </select>
            <input
              onChange={handleAdditionalCapitalChange}
              value={additionalCapital.value}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            VAT (%) *
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              onChange={handleVatChange}
              value={vat}
              className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              type="number"
              min="0"
              step="0.01"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Selling Price (Auto-calculated)
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{currency}</span>
            </div>
            <input
              value={price}
              readOnly
              className="block w-full py-2 pl-10 pr-3 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              type="number"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Discount (%)
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              onChange={handleDiscountChange}
              value={discount}
              className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Variations Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Product Variations *</h3>
            <p className="text-sm text-gray-500">
              Add at least one variation with options
            </p>
          </div>
          <button
            type="button"
            onClick={addVariation}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
            Add Variation
          </button>
        </div>

        <div className="space-y-4">
          {variationError && (
            <div className="p-2 rounded-md bg-red-50">
              <p className="text-sm text-red-600">
                Please complete all variation fields before submitting. Each variation must have:
                <ul className="pl-5 mt-1 list-disc">
                  <li>A variation name</li>
                  <li>At least one option</li>
                  <li>Option name and valid quantity for each option</li>
                </ul>
              </p>
            </div>
          )}

          {variations.map((variation, variationIndex) => (
            <div
              key={variationIndex}
              className={`border rounded-lg bg-white overflow-hidden ${
                variationError && (!variation.name.trim() || variation.options.some(opt => !opt.name.trim() || isNaN(opt.quantity) || opt.quantity < 0))
                  ? "border-red-500"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Variation Name *
                  </label>
                  <input
                    type="text"
                    value={variation.name}
                    onChange={(e) =>
                      handleVariationChange(variationIndex, e.target.value)
                    }
                    placeholder="e.g., Color, Size, Material"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      variationError && !variation.name.trim() ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariation(variationIndex)}
                  className="inline-flex items-center px-3 py-2 ml-4 text-sm font-medium leading-4 text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={variations.length <= 1}
                >
                  <TrashIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  Remove
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Options *</h4>
                  <button
                    type="button"
                    onClick={() => addOption(variationIndex)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="-ml-0.5 mr-1 h-3 w-3" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {variation.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="grid grid-cols-12 gap-3 p-3 rounded-md bg-gray-50"
                    >
                      <div className="col-span-12 sm:col-span-3">
                        <label className="block mb-1 text-xs font-medium text-gray-500">
                          Option Name *
                        </label>
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) =>
                            handleOptionChange(
                              variationIndex,
                              optionIndex,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Red, Large"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                            variationError && !option.name.trim() ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block mb-1 text-xs font-medium text-gray-500">
                          Price Adj.
                        </label>
                        <input
                          type="number"
                          value={option.priceAdjustment ?? ""}
                          onChange={(e) =>
                            handleOptionChange(
                              variationIndex,
                              optionIndex,
                              "priceAdjustment",
                              e.target.value === "" ? undefined : Number(e.target.value)
                            )
                          }
                          placeholder="0.00"
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block mb-1 text-xs font-medium text-gray-500">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          value={option.quantity ?? ""}
                          onChange={(e) =>
                            handleOptionChange(
                              variationIndex,
                              optionIndex,
                              "quantity",
                              e.target.value === "" ? undefined : Number(e.target.value)
                            )
                          }
                          placeholder="0"
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                            variationError && (isNaN(option.quantity) || option.quantity < 0)
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          min="0"
                        />
                      </div>
                      <div className="col-span-9 sm:col-span-3">
                        <label className="block mb-1 text-xs font-medium text-gray-500">
                          SKU (optional)
                        </label>
                        <input
                          type="text"
                          value={option.sku}
                          onChange={(e) =>
                            handleOptionChange(
                              variationIndex,
                              optionIndex,
                              "sku",
                              e.target.value
                            )
                          }
                          placeholder="Unique identifier"
                          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-end col-span-3 sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => removeOption(variationIndex, optionIndex)}
                          className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          disabled={variation.options.length <= 1}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {variations.length > 0 && (
            <div className="p-3 rounded-lg bg-indigo-50">
              <p className="text-sm font-medium text-indigo-800">
                Total Quantity: {calculateTotalQuantity()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Adding...
            </>
          ) : (
            "Add Product"
          )}
        </button>
      </div>
    </form>
  );
};

export default Add;