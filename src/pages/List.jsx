import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaTrash,
  FaStar,
  FaDownload,
  FaUpload,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaMinus
} from "react-icons/fa";
import { backendUrl, currency } from "../App";
import Papa from "papaparse";

const List = ({ token }) => {
  const [state, setState] = useState({
    list: [],
    loading: false,
    sortOption: "",
    updating: {},
    edits: {
      quantities: {},
      discounts: {},
      capitals: {},
      additionalCapitals: {},
      additionalCapitalTypes: {},
      vats: {},
      askForDiscounts: {},
      askForDiscountValues: {},
      askForDiscountEnabled: {},
      variations: {},
    },
    csvUploading: false,
    lowStockThreshold: 10,
    showLowStockOnly: false,
    expandedVariations: {},
  });

  const fileInputRef = useRef(null);

  // Calculate total quantity from variations
  const calculateTotalQuantity = (product) => {
    if (!product?.variations?.length) return product?.quantity || 0;
    
    let total = 0;
    product.variations.forEach(variation => {
      variation.options.forEach(option => {
        total += option.quantity || 0;
      });
    });
    return total;
  };

  // Fetch product list
  const fetchList = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const { data } = await axios.get(`${backendUrl}/api/product/list`);
      if (data?.success) {
        // Calculate total quantities for products with variations
        const productsWithCalculatedQuantities = data.products.map(product => ({
          ...product,
          quantity: calculateTotalQuantity(product)
        }));

        setState((prev) => ({
          ...prev,
          list: productsWithCalculatedQuantities || [],
          edits: {
            quantities: {},
            discounts: {},
            capitals: {},
            additionalCapitals: {},
            additionalCapitalTypes: {},
            vats: {},
            askForDiscounts: {},
            askForDiscountValues: {},
            askForDiscountEnabled: {},
            variations: {},
          },
          expandedVariations: {},
        }));
      } else {
        toast.error(data?.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch products. Please try again.");
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Low stock calculation
  const getLowStockProducts = useCallback(() => {
    return (state.list || []).filter((product) => {
      // If product has variations, check each variation option
      if (product?.variations?.length > 0) {
        return product.variations.some(variation => 
          variation.options.some(option => 
            option.quantity <= state.lowStockThreshold
          )
        );
      }
      // For products without variations, check main quantity
      return (product?.quantity || 0) <= (state.lowStockThreshold || 0);
    });
  }, [state.list, state.lowStockThreshold]);

  // Input change handler
  const handleChange = (id, value, field) => {
    if (field === "additionalCapitalType") {
      setState((prev) => ({
        ...prev,
        edits: {
          ...prev.edits,
          [field]: {
            ...prev.edits[field],
            [id]: value,
          },
        },
      }));
      return;
    }

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setState((prev) => ({
        ...prev,
        edits: {
          ...prev.edits,
          [field]: {
            ...(prev.edits[field] || {}),
            [id]: value === "" ? "" : parseFloat(value) || 0,
          },
        },
      }));
    }
  };

  // Threshold change
  const handleThresholdChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setState((prev) => ({ ...prev, lowStockThreshold: Math.max(0, value) }));
  };

  // Toggle low stock view
  const toggleLowStockView = () => {
    setState((prev) => ({ ...prev, showLowStockOnly: !prev.showLowStockOnly }));
  };

  // Update field
  const updateField = async (id, field, value, validation) => {
    if (!id || field === undefined || value === undefined) {
      toast.error("Invalid update parameters");
      return;
    }
  
    if (validation && !validation(value)) {
      toast.error(`Invalid ${field} value.`);
      return;
    }

    if (field === "askForDiscount") {
      try {
        setState((prev) => ({
          ...prev,
          updating: { ...prev.updating, [id]: true },
        }));

        const { data } = await axios.put(
          `${backendUrl}/api/product/updateAskForDiscount/${id}`,
          { askForDiscount: value },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data?.success) {
          toast.success("Ask for Discount settings updated successfully.");
          setState((prev) => ({
            ...prev,
            list: (prev.list || []).map((item) =>
              item?._id === id
                ? {
                    ...item,
                    askForDiscount: {
                      type: value.type,
                      value: value.value,
                      enabled: value.enabled,
                    },
                  }
                : item
            ),
            edits: {
              ...prev.edits,
              askForDiscounts: Object.fromEntries(
                Object.entries(prev.edits.askForDiscounts || {}).filter(
                  ([key]) => key !== id
                )
              ),
              askForDiscountValues: Object.fromEntries(
                Object.entries(prev.edits.askForDiscountValues || {}).filter(
                  ([key]) => key !== id
                )
              ),
              askForDiscountEnabled: Object.fromEntries(
                Object.entries(prev.edits.askForDiscountEnabled || {}).filter(
                  ([key]) => key !== id
                )
              ),
            },
          }));
        } else {
          toast.error(data?.message || "Failed to update Ask for Discount");
        }
      } catch (error) {
        console.error("Update error:", error);
        toast.error("Failed to update Ask for Discount. Please try again.");
      } finally {
        setState((prev) => ({
          ...prev,
          updating: { ...prev.updating, [id]: false },
        }));
      }
      return;
    }

    setState((prev) => ({
      ...prev,
      updating: { ...prev.updating, [id]: true },
    }));
  
    try {
      const endpoint =
        field === "bestseller"
          ? `${backendUrl}/api/product/updateBestSeller/${id}`
          : `${backendUrl}/api/product/update${
              field.charAt(0).toUpperCase() + field.slice(1)
            }/${id}`;
  
      const { data } = await axios.put(
        endpoint,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (data?.success) {
        toast.success(
          `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully.`
        );
  
        if (['capital', 'additionalCapital', 'vat', 'discount'].includes(field)) {
          const product = state.list.find(item => item?._id === id);
          if (product) {
            const newPrice = calculateFinalPrice({
              ...product,
              [field]: value,
              ...(field === 'additionalCapital' && { additionalCapital: value })
            });

            await axios.put(
              `${backendUrl}/api/product/updatePrice/${id}`,
              { price: newPrice },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }
  
        setState((prev) => ({
          ...prev,
          list: (prev.list || []).map((item) =>
            item?._id === id ? { ...item, [field]: value } : item
          ),
          edits: {
            ...prev.edits,
            [`${field}s`]: Object.fromEntries(
              Object.entries(prev.edits[`${field}s`] || {}).filter(
                ([key]) => key !== id
              )
            ),
          },
        }));
      } else {
        toast.error(data?.message || `Failed to update ${field}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Failed to update ${field}. Please try again.`);
    } finally {
      setState((prev) => ({
        ...prev,
        updating: { ...prev.updating, [id]: false },
      }));
    }
  };

  // Remove product
  const removeProduct = async (id) => {
    if (!id || !window.confirm("Are you sure you want to delete this product?"))
      return;

    setState((prev) => ({
      ...prev,
      updating: { ...prev.updating, [id]: true },
    }));
    try {
      const { data } = await axios.delete(`${backendUrl}/api/product/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { id },
      });

      if (data?.success) {
        toast.success("Product deleted successfully.");
        await fetchList();
      } else {
        toast.error(data?.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete product. Please try again.");
    } finally {
      setState((prev) => ({
        ...prev,
        updating: { ...prev.updating, [id]: false },
      }));
    }
  };

  // Sorting
  const handleSort = (option) => {
    setState((prev) => ({ ...prev, sortOption: option }));

    const sortedList = [...(state.list || [])].sort((a, b) => {
      const aValue = a?.[option.split("-")[0]] || 0;
      const bValue = b?.[option.split("-")[0]] || 0;

      if (option.endsWith("-asc")) return aValue > bValue ? 1 : -1;
      if (option.endsWith("-desc")) return aValue < bValue ? 1 : -1;
      return 0;
    });

    setState((prev) => ({ ...prev, list: sortedList }));
  };

  // CSV upload
  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setState((prev) => ({ ...prev, csvUploading: true }));

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (!results.data || results.data.length === 0) {
            toast.error("CSV file is empty or not properly formatted.");
            return;
          }

          const products = results.data
            .filter((item) => item?.Name)
            .map((item) => {
              // Handle variations if present in CSV
              const variations = [];
              const variationKeys = Object.keys(item).filter(key => key.startsWith('Variation_'));
              
              if (variationKeys.length > 0) {
                const variationGroups = {};
                variationKeys.forEach(key => {
                  const parts = key.split('_');
                  const vIndex = parts[1];
                  const vName = parts[2];
                  const oIndex = parts[4];
                  const prop = parts.slice(5).join('_');

                  if (!variationGroups[vIndex]) {
                    variationGroups[vIndex] = {
                      name: vName,
                      options: {}
                    };
                  }

                  if (!variationGroups[vIndex].options[oIndex]) {
                    variationGroups[vIndex].options[oIndex] = {};
                  }

                  variationGroups[vIndex].options[oIndex][prop.toLowerCase()] = item[key];
                });

                for (const vIndex in variationGroups) {
                  variations.push({
                    name: variationGroups[vIndex].name,
                    options: Object.values(variationGroups[vIndex].options)
                  });
                }
              }

              return {
                name: item?.Name || "",
                description: item?.Description || "",
                category: item?.Category || "",
                capital: parseFloat(item?.Capital) || 0,
                additionalCapital: {
                  type: item?.AdditionalCapitalType || "fixed",
                  value: parseFloat(item?.AdditionalCapitalValue) || 0
                },
                vat: parseFloat(item?.VAT) || 0,
                price: parseFloat(item?.Price) || 0,
                discount: parseFloat(item?.Discount) || 0,
                quantity: parseInt(item?.Quantity) || 0,
                weight: parseFloat(item?.Weight) || 0,
                variations: variations.length > 0 ? variations : undefined,
                askForDiscount: {
                  type: item?.AskDiscountType || "percent",
                  value: parseFloat(item?.AskDiscountValue) || 0,
                  enabled: item?.AskDiscountEnabled === "true"
                }
              };
            });

          if (products.length === 0) {
            toast.error("No valid products found in CSV.");
            return;
          }

          const { data } = await axios.post(
            `${backendUrl}/api/product/bulk`,
            { products },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (data?.success) {
            toast.success(
              `Imported ${data.insertedCount || 0} products successfully!`
            );
            await fetchList();
          } else {
            toast.error(data?.message || "Import failed");
          }
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          toast.error("Error parsing CSV file");
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload CSV");
    } finally {
      setState((prev) => ({ ...prev, csvUploading: false }));
      event.target.value = "";
    }
  };

  // CSV download
  const downloadCSV = () => {
    const productsToDownload = state.showLowStockOnly
      ? getLowStockProducts()
      : state.list || [];

    if (productsToDownload.length === 0) {
      toast.error("No data available to download.");
      return;
    }

    const headers = [
      "Name",
      "Description",
      "Category",
      "Capital",
      "AdditionalCapitalType",
      "AdditionalCapitalValue",
      "VAT",
      "Price",
      "Discount",
      "Quantity",
      "Weight",
      "AskDiscountType",
      "AskDiscountValue",
      "AskDiscountEnabled"
    ];

    // Add variation headers if any product has variations
    const hasVariations = productsToDownload.some(p => p?.variations?.length > 0);
    if (hasVariations) {
      let maxVariations = 0;
      let maxOptions = 0;
      
      productsToDownload.forEach(product => {
        if (product?.variations?.length > maxVariations) {
          maxVariations = product.variations.length;
        }
        product?.variations?.forEach(variation => {
          if (variation.options?.length > maxOptions) {
            maxOptions = variation.options.length;
          }
        });
      });

      for (let v = 0; v < maxVariations; v++) {
        for (let o = 0; o < maxOptions; o++) {
          headers.push(`Variation_${v}_VariationName_Option_${o}_Name`);
          headers.push(`Variation_${v}_VariationName_Option_${o}_PriceAdjustment`);
          headers.push(`Variation_${v}_VariationName_Option_${o}_Quantity`);
          headers.push(`Variation_${v}_VariationName_Option_${o}_SKU`);
        }
      }
    }

    const rows = productsToDownload.map((product) => {
      const baseRow = [
        product?.name || "",
        product?.description || "",
        product?.category || "",
        product?.capital || 0,
        product?.additionalCapital?.type || "fixed",
        product?.additionalCapital?.value || 0,
        product?.vat || 0,
        product?.price || 0,
        product?.discount || 0,
        product?.quantity || 0,
        product?.weight || 0,
        product?.askForDiscount?.type || "percent",
        product?.askForDiscount?.value || 0,
        product?.askForDiscount?.enabled ? "true" : "false"
      ];

      // Add variation data if present
      if (hasVariations && product?.variations) {
        product.variations.forEach((variation, vIndex) => {
          variation.options.forEach((option, oIndex) => {
            baseRow.push(option.name || "");
            baseRow.push(option.priceAdjustment || 0);
            baseRow.push(option.quantity || 0);
            baseRow.push(option.sku || "");
          });
          // Fill empty cells if this product has fewer options than max
          for (let o = variation.options.length; o < maxOptions; o++) {
            baseRow.push("", "", "", "");
          }
        });
        // Fill empty cells if this product has fewer variations than max
        for (let v = product.variations.length; v < maxVariations; v++) {
          for (let o = 0; o < maxOptions; o++) {
            baseRow.push("", "", "", "");
          }
        }
      }

      return baseRow;
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `products_${new Date().toISOString().slice(0, 10)}_${state.showLowStockOnly ? "low_stock" : "all"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Price calculation
  const calculateFinalPrice = (product) => {
    if (!product) return 0;
  
    const capital = product.capital || 0;
    const vat = product.vat || 0;
  
    let additionalCapital = 0;
    if (product.additionalCapital) {
      additionalCapital =
        product.additionalCapital.type === "percent"
          ? capital * (product.additionalCapital.value / 100)
          : product.additionalCapital.value || 0;
    }
  
    const basePrice = capital + additionalCapital;
    const priceWithVat = basePrice * (1 + vat / 100);
    const discount = product.discount || 0;
    const finalPrice = discount > 0 
      ? priceWithVat * (1 - discount / 100)
      : priceWithVat;
  
    return Math.max(0, finalPrice);
  };

  // Variation management functions
  const toggleVariationExpansion = (productId) => {
    setState((prev) => ({
      ...prev,
      expandedVariations: {
        ...prev.expandedVariations,
        [productId]: !prev.expandedVariations[productId],
      },
    }));
  };

  const handleVariationChange = (productId, variationIndex, optionIndex, field, value) => {
    setState((prev) => {
      const newVariations = { ...prev.edits.variations };
      if (!newVariations[productId]) {
        newVariations[productId] = JSON.parse(JSON.stringify(
          prev.list.find(p => p._id === productId)?.variations || []
        ));
      }
      
      if (field === 'optionName') {
        newVariations[productId][variationIndex].options[optionIndex].name = value;
      } else if (field === 'priceAdjustment') {
        newVariations[productId][variationIndex].options[optionIndex].priceAdjustment = 
          value === "" ? "" : parseFloat(value) || 0;
      } else if (field === 'quantity') {
        newVariations[productId][variationIndex].options[optionIndex].quantity = 
          value === "" ? "" : parseInt(value) || 0;
      } else if (field === 'sku') {
        newVariations[productId][variationIndex].options[optionIndex].sku = value;
      }

      return {
        ...prev,
        edits: {
          ...prev.edits,
          variations: newVariations,
        },
      };
    });
  };

  const updateVariations = async (productId) => {
    if (!productId || !state.edits.variations[productId]) return;

    setState((prev) => ({
      ...prev,
      updating: { ...prev.updating, [productId]: true },
    }));

    try {
      const { data } = await axios.put(
        `${backendUrl}/api/product/updateVariations/${productId}`,
        { variations: state.edits.variations[productId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.success) {
        toast.success("Variations updated successfully");
        // Calculate new total quantity after updating variations
        const updatedProduct = {
          ...data.product,
          quantity: calculateTotalQuantity(data.product)
        };
        
        setState(prev => ({
          ...prev,
          list: prev.list.map(p => 
            p._id === productId ? updatedProduct : p
          ),
          edits: {
            ...prev.edits,
            variations: {
              ...prev.edits.variations,
              [productId]: undefined
            }
          }
        }));
      } else {
        toast.error(data?.message || "Failed to update variations");
      }
    } catch (error) {
      console.error("Update variations error:", error);
      toast.error("Failed to update variations. Please try again.");
    } finally {
      setState((prev) => ({
        ...prev,
        updating: { ...prev.updating, [productId]: false },
      }));
    }
  };

  const addVariationOption = (productId, variationIndex) => {
    setState((prev) => {
      const newVariations = { ...prev.edits.variations };
      if (!newVariations[productId]) {
        newVariations[productId] = JSON.parse(JSON.stringify(
          prev.list.find(p => p._id === productId)?.variations || []
        ));
      }

      newVariations[productId][variationIndex].options.push({
        name: "",
        priceAdjustment: 0,
        quantity: 0,
        sku: ""
      });

      return {
        ...prev,
        edits: {
          ...prev.edits,
          variations: newVariations,
        },
      };
    });
  };

  const removeVariationOption = (productId, variationIndex, optionIndex) => {
    setState((prev) => {
      const newVariations = { ...prev.edits.variations };
      if (!newVariations[productId]) {
        newVariations[productId] = JSON.parse(JSON.stringify(
          prev.list.find(p => p._id === productId)?.variations || []
        ));
      }

      newVariations[productId][variationIndex].options.splice(optionIndex, 1);

      return {
        ...prev,
        edits: {
          ...prev.edits,
          variations: newVariations,
        },
      };
    });
  };

  const addVariation = (productId) => {
    setState((prev) => {
      const newVariations = { ...prev.edits.variations };
      if (!newVariations[productId]) {
        newVariations[productId] = JSON.parse(JSON.stringify(
          prev.list.find(p => p._id === productId)?.variations || []
        ));
      }

      newVariations[productId].push({
        name: "",
        options: [{
          name: "",
          priceAdjustment: 0,
          quantity: 0,
          sku: ""
        }]
      });

      return {
        ...prev,
        edits: {
          ...prev.edits,
          variations: newVariations,
        },
      };
    });
  };

  const removeVariation = (productId, variationIndex) => {
    setState((prev) => {
      const newVariations = { ...prev.edits.variations };
      if (!newVariations[productId]) {
        newVariations[productId] = JSON.parse(JSON.stringify(
          prev.list.find(p => p._id === productId)?.variations || []
        ));
      }

      newVariations[productId].splice(variationIndex, 1);

      return {
        ...prev,
        edits: {
          ...prev.edits,
          variations: newVariations,
        },
      };
    });
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  if (state.loading)
    return <div className="p-4 text-center">Loading products...</div>;

  const displayedProducts = state.showLowStockOnly
    ? getLowStockProducts()
    : state.list || [];
  const lowStockCount = getLowStockProducts().length;

  return (
    <div className="p-4">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">
            {state.showLowStockOnly
              ? "Low Stock Products"
              : "All Products List"}
            {state.showLowStockOnly && (
              <span className="ml-2 text-sm font-normal text-red-500 whitespace-nowrap">
                ({lowStockCount} low stock items)
              </span>
            )}
          </h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={state.csvUploading}
            className="flex items-center justify-center px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 sm:justify-start"
          >
            <FaUpload className="mr-2" />
            {state.csvUploading ? "Uploading..." : "Upload CSV"}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCSVUpload}
              accept=".csv"
              className="hidden"
            />
          </button>

          <button
            onClick={downloadCSV}
            className="flex items-center justify-center px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 sm:justify-start"
          >
            <FaDownload className="mr-2" />
            Download {state.showLowStockOnly ? "Low Stock" : "All"} CSV
          </button>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label className="mr-2 font-medium">Sort By:</label>
          <select
            value={state.sortOption}
            onChange={(e) => handleSort(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="">Default</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="discount-asc">Discount (Low to High)</option>
            <option value="discount-desc">Discount (High to Low)</option>
            <option value="quantity-asc">Quantity (Low to High)</option>
            <option value="quantity-desc">Quantity (High to Low)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-medium">Low Stock Threshold:</label>
          <input
            type="number"
            min="1"
            value={state.lowStockThreshold}
            onChange={handleThresholdChange}
            className="w-16 p-2 border rounded-md"
          />
        </div>

        <button
          onClick={toggleLowStockView}
          className={`px-4 py-2 rounded-md ${
            state.showLowStockOnly
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-yellow-500 text-white hover:bg-yellow-600"
          }`}
        >
          {state.showLowStockOnly ? "Show All Products" : "Show Low Stock Only"}
        </button>
      </div>

      {/* Empty State */}
      {state.showLowStockOnly && lowStockCount === 0 && (
        <div className="p-4 text-center bg-yellow-100 rounded-md">
          No products below the threshold of {state.lowStockThreshold} items.
        </div>
      )}

      {/* Product Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-10 px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-white">
                Image
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-white md:static md:left-[80px] lg:sticky">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Capital
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Add. Capital
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                VAT
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Discount
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Ask Discount
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Tot. Price
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Weight
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedProducts.map((product) => {
              const isLowStock = getLowStockProducts().some(p => p._id === product._id);
              const hasVariations = product?.variations?.length > 0;
              const isExpanded = state.expandedVariations[product._id];
              const variationsToShow = state.edits.variations[product._id] || product.variations || [];

              return (
                <React.Fragment key={product?._id}>
                  <tr className={`hover:bg-gray-50 ${isLowStock ? "bg-red-50" : ""}`}>
                    <td className="sticky left-0 z-10 px-6 py-4 bg-white whitespace-nowrap">
                      <img
                        src={product?.image?.[0] || ""}
                        alt={product?.name || "Product"}
                        className="object-cover w-12 h-12 rounded"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/50";
                          e.target.alt = "Placeholder image";
                        }}
                      />
                    </td>
                    <td className="md:static lg:sticky left-[80px] px-6 py-4 text-sm text-gray-900 whitespace-nowrap bg-white z-10">
                      <div className="flex items-center gap-2">
                        {isLowStock && (
                          <FaExclamationTriangle className="text-yellow-500" title="Low stock" />
                        )}
                        {product?.name || "Unknown Product"}
                        {hasVariations && (
                          <button 
                            onClick={() => toggleVariationExpansion(product._id)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {product?.category || "-"}
                    </td>

                    {/* Capital Field */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            state.edits.capitals?.[product._id] ??
                            product?.capital ??
                            0
                          }
                          onChange={(e) =>
                            handleChange(product._id, e.target.value, "capitals")
                          }
                          className="w-20 p-1 text-center border rounded"
                        />
                        <button
                          onClick={() =>
                            updateField(
                              product._id,
                              "capital",
                              state.edits.capitals?.[product._id] ??
                                product?.capital,
                              (val) => val >= 0
                            )
                          }
                          disabled={state.updating[product._id]}
                          className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          {state.updating[product._id] ? "..." : "Save"}
                        </button>
                      </div>
                    </td>

                    {/* Additional Capital Field */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={
                              state.edits.additionalCapitalTypes?.[product._id] ??
                              product?.additionalCapital?.type ??
                              "fixed"
                            }
                            onChange={(e) => {
                              setState((prev) => ({
                                ...prev,
                                edits: {
                                  ...prev.edits,
                                  additionalCapitalTypes: {
                                    ...prev.edits.additionalCapitalTypes,
                                    [product._id]: e.target.value,
                                  },
                                },
                              }));
                            }}
                            className="p-1 border rounded"
                          >
                            <option value="fixed">{currency}</option>
                            <option value="percent">%</option>
                          </select>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              state.edits.additionalCapitals?.[product._id] ??
                              product?.additionalCapital?.value ??
                              0
                            }
                            onChange={(e) =>
                              handleChange(
                                product._id,
                                e.target.value,
                                "additionalCapitals"
                              )
                            }
                            className="w-20 p-1 border rounded"
                          />
                        </div>

                        <button
                          onClick={() => {
                            const newType =
                              state.edits.additionalCapitalTypes?.[product._id] ??
                              product?.additionalCapital?.type ??
                              "fixed";
                            const newValue =
                              state.edits.additionalCapitals?.[product._id] ??
                              product?.additionalCapital?.value ??
                              0;

                            updateField(product._id, "additionalCapital", {
                              type: newType,
                              value: parseFloat(newValue) || 0,
                            });
                          }}
                          disabled={state.updating[product._id]}
                          className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          {state.updating[product._id] ? "..." : "Save"}
                        </button>
                      </div>
                    </td>

                    {/* VAT Field */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            state.edits.vats?.[product._id] ?? product?.vat ?? 0
                          }
                          onChange={(e) =>
                            handleChange(product._id, e.target.value, "vats")
                          }
                          className="w-20 p-1 text-center border rounded"
                        />
                        <button
                          onClick={() =>
                            updateField(
                              product._id,
                              "vat",
                              state.edits.vats?.[product._id] ?? product?.vat,
                              (val) => val >= 0 && val <= 100
                            )
                          }
                          disabled={state.updating[product._id]}
                          className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          {state.updating[product._id] ? "..." : "Save"}
                        </button>
                      </div>
                    </td>

                    {/* Discount Field */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            state.edits.discounts?.[product._id] ??
                            product?.discount ??
                            0
                          }
                          onChange={(e) =>
                            handleChange(product._id, e.target.value, "discounts")
                          }
                          className="w-20 p-1 text-center border rounded"
                        />
                        <button
                          onClick={() =>
                            updateField(
                              product._id,
                              "discount",
                              state.edits.discounts?.[product._id] ??
                                product?.discount ??
                                0,
                              (val) => val >= 0 && val <= 100
                            )
                          }
                          disabled={state.updating[product._id]}
                          className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          {state.updating[product._id] ? "..." : "Save"}
                        </button>
                      </div>
                    </td>

                    {/* Ask Discount Field */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={
                              state.edits.askForDiscounts?.[product._id] ??
                              product?.askForDiscount?.type ??
                              "percent"
                            }
                            onChange={(e) => {
                              handleChange(
                                product._id,
                                e.target.value,
                                "askForDiscounts"
                              );
                              handleChange(
                                product._id,
                                0,
                                "askForDiscountValues"
                              );
                            }}
                            className="p-1 border rounded"
                          >
                            <option value="percent">%</option>
                            <option value="amount">{currency}</option>
                          </select>

                          <input
                            type="number"
                            min="0"
                            max={
                              state.edits.askForDiscounts?.[product._id] ===
                                "percent" ||
                              (product?.askForDiscount?.type === "percent" &&
                                !state.edits.askForDiscounts?.[product._id])
                                ? "100"
                                : undefined
                            }
                            step={
                              state.edits.askForDiscounts?.[product._id] ===
                                "amount" ||
                              (product?.askForDiscount?.type === "amount" &&
                                !state.edits.askForDiscounts?.[product._id])
                                ? "0.01"
                                : "1"
                            }
                            value={
                              state.edits.askForDiscountValues?.[product._id] ??
                              product?.askForDiscount?.value ??
                              0
                            }
                            onChange={(e) =>
                              handleChange(
                                product._id,
                                e.target.value,
                                "askForDiscountValues"
                              )
                            }
                            className="w-20 p-1 border rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Enable:</label>
                            <input
                              type="checkbox"
                              checked={
                                state.edits.askForDiscountEnabled?.[
                                  product._id
                                ] ??
                                product?.askForDiscount?.enabled ??
                                false
                              }
                              onChange={(e) => {
                                setState((prev) => ({
                                  ...prev,
                                  edits: {
                                    ...prev.edits,
                                    askForDiscountEnabled: {
                                      ...prev.edits.askForDiscountEnabled,
                                      [product._id]: e.target.checked,
                                    },
                                  },
                                }));
                              }}
                            />
                          </div>

                          <button
                            onClick={() => {
                              const askForDiscountData = {
                                type:
                                  state.edits.askForDiscounts?.[product._id] ??
                                  product?.askForDiscount?.type ??
                                  "percent",
                                value: parseFloat(
                                  state.edits.askForDiscountValues?.[
                                    product._id
                                  ] ??
                                    product?.askForDiscount?.value ??
                                    0
                                ),
                                enabled:
                                  state.edits.askForDiscountEnabled?.[
                                    product._id
                                  ] ??
                                  product?.askForDiscount?.enabled ??
                                  false,
                              };
                              updateField(
                                product._id,
                                "askForDiscount",
                                askForDiscountData
                              );
                            }}
                            disabled={state.updating[product._id]}
                            className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            {state.updating[product._id] ? "..." : "Save"}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Quantity Field - Now display only */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`w-20 p-1 text-center border rounded ${
                        (product?.quantity || 0) <= state.lowStockThreshold ? "border-red-500 bg-red-50" : ""
                      }`}>
                        {product?.quantity || 0}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {currency}
                      {calculateFinalPrice(product).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {product?.weight || 0} kg
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            updateField(
                              product._id,
                              "bestseller",
                              !product.bestseller
                            );
                          }}
                          className={`p-2 rounded-md ${
                            product?.bestseller
                              ? "bg-yellow-500 text-white hover:bg-yellow-600"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                          disabled={state.updating[product._id]}
                          title={
                            product?.bestseller
                              ? "Remove from bestsellers"
                              : "Add to bestsellers"
                          }
                        >
                          <FaStar />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeProduct(product._id);
                          }}
                          className="p-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                          disabled={state.updating[product._id]}
                          title="Delete product"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Variations section */}
                  {isExpanded && hasVariations && (
                    <tr className="bg-gray-50">
                      <td colSpan="12" className="px-4 py-2">
                        <div className="p-4 bg-white rounded-lg shadow">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold">Product Variations</h3>
                            <button
                              onClick={() => addVariation(product._id)}
                              className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                            >
                              <FaPlus className="inline mr-1" /> Add Variation
                            </button>
                          </div>

                          {variationsToShow.map((variation, varIndex) => (
                            <div key={varIndex} className="p-3 mb-6 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">Variation:</h4>
                                  <input
                                    type="text"
                                    value={variation.name}
                                    onChange={(e) => {
                                      const newVariations = { ...state.edits.variations };
                                      if (!newVariations[product._id]) {
                                        newVariations[product._id] = JSON.parse(JSON.stringify(
                                          product.variations
                                        ));
                                      }
                                      newVariations[product._id][varIndex].name = e.target.value;
                                      setState(prev => ({
                                        ...prev,
                                        edits: {
                                          ...prev.edits,
                                          variations: newVariations
                                        }
                                      }));
                                    }}
                                    className="p-1 border rounded"
                                    placeholder="Variation name"
                                  />
                                </div>
                                <button
                                  onClick={() => removeVariation(product._id, varIndex)}
                                  className="px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                                >
                                  <FaMinus className="inline" />
                                </button>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left">Option Name</th>
                                      <th className="px-4 py-2 text-left">Price Adjustment</th>
                                      <th className="px-4 py-2 text-left">Quantity</th>
                                      <th className="px-4 py-2 text-left">SKU</th>
                                      <th className="px-4 py-2 text-left">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {variation.options.map((option, optIndex) => (
                                      <tr key={optIndex} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                          <input
                                            type="text"
                                            value={option.name}
                                            onChange={(e) => handleVariationChange(
                                              product._id, 
                                              varIndex, 
                                              optIndex, 
                                              'optionName', 
                                              e.target.value
                                            )}
                                            className="w-full p-1 border rounded"
                                            placeholder="Option name"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={option.priceAdjustment}
                                            onChange={(e) => handleVariationChange(
                                              product._id, 
                                              varIndex, 
                                              optIndex, 
                                              'priceAdjustment', 
                                              e.target.value
                                            )}
                                            className="w-full p-1 border rounded"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input
                                            type="number"
                                            min="0"
                                            value={option.quantity}
                                            onChange={(e) => handleVariationChange(
                                              product._id, 
                                              varIndex, 
                                              optIndex, 
                                              'quantity', 
                                              e.target.value
                                            )}
                                            className={`w-full p-1 border rounded ${
                                              option.quantity <= state.lowStockThreshold ? 'border-red-500' : ''
                                            }`}
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <input
                                            type="text"
                                            value={option.sku || ""}
                                            onChange={(e) => handleVariationChange(
                                              product._id, 
                                              varIndex, 
                                              optIndex, 
                                              'sku', 
                                              e.target.value
                                            )}
                                            className="w-full p-1 border rounded"
                                            placeholder="SKU"
                                          />
                                        </td>
                                        <td className="px-4 py-2">
                                          <button
                                            onClick={() => removeVariationOption(product._id, varIndex, optIndex)}
                                            className="p-1 text-white bg-red-500 rounded hover:bg-red-600"
                                          >
                                            <FaMinus />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div className="mt-2">
                                <button
                                  onClick={() => addVariationOption(product._id, varIndex)}
                                  className="px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                                >
                                  <FaPlus className="inline mr-1" /> Add Option
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-end mt-4">
                            <button
                              onClick={() => updateVariations(product._id)}
                              disabled={state.updating[product._id]}
                              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                              {state.updating[product._id] ? "Saving..." : "Save Variations"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default List;