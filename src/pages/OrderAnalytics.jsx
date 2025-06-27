import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import Chart from "chart.js/auto";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import ViewersTracker from "../components/ViewersTracker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Review from "../components/Review";

import Plot from "react-plotly.js";
import { FaUserShield, FaUserTie, FaUser } from 'react-icons/fa';

const OrderAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const token = localStorage.getItem("authToken");
  console.log("Token: ", token);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalCapital: 0,
    totalAdditionalCapital: 0,
    totalCombinedCapital: 0,
    totalVariationAdjustment: 0,
    totalProfit: 0,
    totalShippingFee: 0,
    totalVAT: 0,
    vatPercentage: 0,
    totalOrders: 0,
    orderStatusDistribution: {},
    topProducts: {},
    lowStockProducts: [],
    timeBasedAnalysis: {
      daily: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
      weekly: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
      monthly: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
      annually: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
    },
    averageOrderValue: 0,
    customerMetrics: {
      repeatCustomers: 0,
      newCustomers: 0,
      averagePurchaseFrequency: 0,
      customerRetentionRate: 0,
      customerLifetimeValue: 0,
      averageCustomerValue: 0,
    },
    financialMetrics: {
      grossProfitMargin: 0,
      netProfitMargin: 0,
      returnOnInvestment: 0,
      averageProfitPerOrder: 0,
      profitTrend: [],
      salesTrend: [],
      capitalTrend: [],
    }
  });

  const [timeRange, setTimeRange] = useState({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    endDate: new Date(),
  });
  const [analysisLevel, setAnalysisLevel] = useState("monthly");
  const [csvUploading, setCsvUploading] = useState(false);

  // Chart references
  const statusChartRef = useRef(null);
  const productChartRef = useRef(null);
  const earningsChartRef = useRef(null);
  const timeAnalysisChartRef = useRef(null);
  const stockChartRef = useRef(null);
  const marginChartRef = useRef(null);

  // Safe number formatting function
  const formatNumber = (num) => {
    return num?.toLocaleString?.() ?? "0";
  };

  // Fetch orders from backend
  const fetchAllOrders = async () => {
    if (!token) {
      toast.error("Authentication token is missing!");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const filteredOrders =
          response.data.orders?.filter((order) => {
            const orderDate = new Date(order.date);
            return (
              orderDate >= timeRange.startDate && orderDate <= timeRange.endDate
            );
          }) || [];
        setOrders(filteredOrders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(
        "Failed to fetch orders: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Fetch products from backend
  const fetchProducts = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${backendUrl}/api/product/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(
        "Failed to fetch products: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Calculate analytics with time-based analysis
  const calculateAnalytics = () => {
    // Filter out cancelled orders
    const validOrders = orders.filter((order) => order.status !== "Canceled");
    const cancelledOrders = orders.length - validOrders.length;

    // Identify low stock products (quantity < 10)
    const lowStockProducts = products.filter((product) => {
      const totalQuantity =
        product.variations?.reduce((sum, variation) => {
          return (
            sum +
            variation.options?.reduce((optSum, option) => {
              return optSum + (option.quantity || 0);
            }, 0)
          );
        }, 0) ||
        product.quantity ||
        0;
      return totalQuantity < 10;
    });

    if (!validOrders || validOrders.length === 0) {
      setAnalytics({
        totalSales: 0,
        totalCapital: 0,
        totalAdditionalCapital: 0,
        totalCombinedCapital: 0,
        totalShippingFee: 0,
        totalProfit: 0,
        totalVariationAdjustment: 0,
        totalVAT: 0,
        vatPercentage: 0,
        totalOrders: 0,
        cancelledOrders,
        orderStatusDistribution: {},
        topProducts: {},
        lowStockProducts,
        timeBasedAnalysis: {
          daily: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
          weekly: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
          monthly: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
          annually: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
        },
        averageOrderValue: 0,
        customerMetrics: {
          repeatCustomers: 0,
          newCustomers: 0,
          averagePurchaseFrequency: 0,
          customerRetentionRate: 0,
          customerLifetimeValue: 0,
          averageCustomerValue: 0,
        },
        financialMetrics: {
          grossProfitMargin: 0,
          netProfitMargin: 0,
          returnOnInvestment: 0,
          averageProfitPerOrder: 0,
          profitTrend: [],
          salesTrend: [],
          capitalTrend: [],
        }
      });
      return;
    }

    let totalSales = 0;
    let totalCapital = 0;
    let totalAdditionalCapital = 0;
    let totalVariationAdjustment = 0;
    let totalVAT = 0;
    let totalShippingFee = 0;
    const totalOrders = validOrders.length;

    const orderStatusDistribution = {};
    const topProducts = {};
    const timeBasedAnalysis = {
      daily: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
      weekly: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
      monthly: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
      annually: { sales: {}, capital: {}, profit: {}, vat: {}, margin: {}, roi: {} },
    };

    const customerOrders = {};
    const customerFirstPurchase = {};
    const customerTotalSpent = {};
    const profitTrend = [];
    const salesTrend = [];
    const capitalTrend = [];

    validOrders.forEach((order) => {
      if (!order) return;

      // Order status count
      orderStatusDistribution[order.status] = (orderStatusDistribution[order.status] || 0) + 1;

      // Product sales count and revenue
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item && item.name) {
            topProducts[item.name] = (topProducts[item.name] || 0) + (item.quantity || 0);
          }
        });
      }

      // Calculate order values (match Orders.jsx logic)
      let orderCapital = 0;
      let orderAdditionalCapital = 0;
      let orderVAT = 0;
      let orderVariationAdjustment = 0;
      let subtotal = 0;
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const itemVariationAdjustment = item.variationAdjustment || 0;
          const itemCapital = item.capital || 0;
          let itemMarkup = 0;
          if (item.additionalCapital) {
            if (item.additionalCapital.type === 'percent') {
              itemMarkup = itemCapital * (item.additionalCapital.value / 100);
            } else {
              itemMarkup = item.additionalCapital.value || 0;
            }
          }
          const subtotalBase = itemCapital + itemMarkup;
          const vatPercent = item.vat || 0;
          const vatAmount = subtotalBase * (vatPercent / 100);
          const basePrice = subtotalBase + vatAmount;
          const discountPercent = item.discount || 0;
          // New logic: discounted price = (basePrice * (1 - discount%)) + variationAdjustment
          const discountedPrice = (basePrice * (1 - discountPercent / 100)) + itemVariationAdjustment;
          const priceWithVariation = basePrice + itemVariationAdjustment;
          const finalPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
          const quantity = item.quantity || 0;
          orderCapital += itemCapital * quantity;
          orderAdditionalCapital += itemMarkup * quantity;
          orderVariationAdjustment += itemVariationAdjustment * quantity;
          // Calculate VAT for this item
          orderVAT += vatAmount * quantity;
          // Subtotal logic (new)
          const itemTotal = Math.round((finalPrice * quantity) * 100) / 100;
          subtotal = Math.round((subtotal + itemTotal) * 100) / 100;
        });
      }
      const discount = order.discountAmount || 0;
      const voucher = order.voucherAmount || 0;
      const shipping = order.shippingFee || 0;
      // Orders.jsx: total = subtotal - discount - voucher + shipping
      const orderAmount = Math.round((subtotal - discount - voucher + shipping) * 100) / 100;
      totalSales += orderAmount;
      totalShippingFee += shipping;

      totalCapital += orderCapital;
      totalAdditionalCapital += orderAdditionalCapital + orderVariationAdjustment;
      totalVAT += orderVAT;
      totalVariationAdjustment += orderVariationAdjustment;

      const orderCombinedCapital = orderCapital + orderAdditionalCapital;
      const orderProfit = orderAmount - orderCombinedCapital - shipping;

      // Time-based analysis (use orderAmount)
      const orderDate = new Date(order.date);
      if (isNaN(orderDate)) return;

      // Daily analysis
      const dayKey = orderDate.toISOString().split("T")[0];
      timeBasedAnalysis.daily.sales[dayKey] = (timeBasedAnalysis.daily.sales[dayKey] || 0) + orderAmount;
      timeBasedAnalysis.daily.capital[dayKey] = (timeBasedAnalysis.daily.capital[dayKey] || 0) + orderCombinedCapital;
      timeBasedAnalysis.daily.profit[dayKey] = (timeBasedAnalysis.daily.profit[dayKey] || 0) + orderProfit;
      timeBasedAnalysis.daily.vat[dayKey] = (timeBasedAnalysis.daily.vat[dayKey] || 0) + orderVAT;
      timeBasedAnalysis.daily.margin[dayKey] = orderAmount > 0 ? (orderProfit / orderAmount) * 100 : 0;
      timeBasedAnalysis.daily.roi[dayKey] = orderCombinedCapital > 0 ? (orderProfit / orderCombinedCapital) * 100 : 0;

      // Weekly analysis
      const weekNumber = getWeekNumber(orderDate);
      const weekKey = `${orderDate.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
      timeBasedAnalysis.weekly.sales[weekKey] = (timeBasedAnalysis.weekly.sales[weekKey] || 0) + orderAmount;
      timeBasedAnalysis.weekly.capital[weekKey] = (timeBasedAnalysis.weekly.capital[weekKey] || 0) + orderCombinedCapital;
      timeBasedAnalysis.weekly.profit[weekKey] = (timeBasedAnalysis.weekly.profit[weekKey] || 0) + orderProfit;
      timeBasedAnalysis.weekly.vat[weekKey] = (timeBasedAnalysis.weekly.vat[weekKey] || 0) + orderVAT;
      timeBasedAnalysis.weekly.margin[weekKey] = orderAmount > 0 ? (orderProfit / orderAmount) * 100 : 0;
      timeBasedAnalysis.weekly.roi[weekKey] = orderCombinedCapital > 0 ? (orderProfit / orderCombinedCapital) * 100 : 0;

      // Monthly analysis
      const monthKey = orderDate.toLocaleString("default", { year: "numeric", month: "long" });
      timeBasedAnalysis.monthly.sales[monthKey] = (timeBasedAnalysis.monthly.sales[monthKey] || 0) + orderAmount;
      timeBasedAnalysis.monthly.capital[monthKey] = (timeBasedAnalysis.monthly.capital[monthKey] || 0) + orderCombinedCapital;
      timeBasedAnalysis.monthly.profit[monthKey] = (timeBasedAnalysis.monthly.profit[monthKey] || 0) + orderProfit;
      timeBasedAnalysis.monthly.vat[monthKey] = (timeBasedAnalysis.monthly.vat[monthKey] || 0) + orderVAT;
      timeBasedAnalysis.monthly.margin[monthKey] = orderAmount > 0 ? (orderProfit / orderAmount) * 100 : 0;
      timeBasedAnalysis.monthly.roi[monthKey] = orderCombinedCapital > 0 ? (orderProfit / orderCombinedCapital) * 100 : 0;

      // Annual analysis
      const yearKey = orderDate.getFullYear().toString();
      timeBasedAnalysis.annually.sales[yearKey] = (timeBasedAnalysis.annually.sales[yearKey] || 0) + orderAmount;
      timeBasedAnalysis.annually.capital[yearKey] = (timeBasedAnalysis.annually.capital[yearKey] || 0) + orderCombinedCapital;
      timeBasedAnalysis.annually.profit[yearKey] = (timeBasedAnalysis.annually.profit[yearKey] || 0) + orderProfit;
      timeBasedAnalysis.annually.vat[yearKey] = (timeBasedAnalysis.annually.vat[yearKey] || 0) + orderVAT;
      timeBasedAnalysis.annually.margin[yearKey] = orderAmount > 0 ? (orderProfit / orderAmount) * 100 : 0;
      timeBasedAnalysis.annually.roi[yearKey] = orderCombinedCapital > 0 ? (orderProfit / orderCombinedCapital) * 100 : 0;

      // Customer metrics
      if (order.userId) {
        customerOrders[order.userId] = (customerOrders[order.userId] || 0) + 1;
        customerTotalSpent[order.userId] = (customerTotalSpent[order.userId] || 0) + orderAmount;
        if (!customerFirstPurchase[order.userId]) {
          customerFirstPurchase[order.userId] = orderDate;
        }
      }

      // Track trends
      profitTrend.push({ date: orderDate, value: orderProfit });
      salesTrend.push({ date: orderDate, value: orderAmount });
      capitalTrend.push({ date: orderDate, value: orderCombinedCapital });
    });

    // Calculate customer metrics
    const customerCount = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter((count) => count > 1).length;
    const newCustomers = customerCount - repeatCustomers;
    const averagePurchaseFrequency = customerCount > 0 ? totalOrders / customerCount : 0;

    // Calculate customer retention rate
    const customerRetentionRate = customerCount > 0 ? (repeatCustomers / customerCount) * 100 : 0;

    // Calculate customer lifetime value
    const customerLifetimeValue = customerCount > 0 
      ? Object.values(customerTotalSpent).reduce((sum, spent) => sum + spent, 0) / customerCount 
      : 0;

    // Calculate average customer value
    const averageCustomerValue = customerCount > 0 
      ? totalSales / customerCount 
      : 0;

    const totalCombinedCapital = totalCapital + totalAdditionalCapital;
    const totalProfit = totalSales - totalCombinedCapital - totalShippingFee;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const vatPercentage = totalSales > 0 ? (totalVAT / totalSales) * 100 : 0;

    // Calculate financial metrics
    const grossProfitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const netProfitMargin = totalSales > 0 ? ((totalProfit - totalVAT) / totalSales) * 100 : 0;
    const returnOnInvestment = totalCombinedCapital > 0 ? (totalProfit / totalCombinedCapital) * 100 : 0;
    const averageProfitPerOrder = totalOrders > 0 ? totalProfit / totalOrders : 0;

    // Sort trends by date
    profitTrend.sort((a, b) => a.date - b.date);
    salesTrend.sort((a, b) => a.date - b.date);
    capitalTrend.sort((a, b) => a.date - b.date);

    setAnalytics({
      totalSales,
      totalCapital,
      totalAdditionalCapital,
      totalCombinedCapital,
      totalVariationAdjustment,
      totalProfit,
      totalVAT,
      totalShippingFee,
      vatPercentage,
      totalOrders,
      cancelledOrders,
      orderStatusDistribution,
      topProducts,
      lowStockProducts,
      timeBasedAnalysis,
      averageOrderValue,
      customerMetrics: {
        repeatCustomers,
        newCustomers,
        averagePurchaseFrequency,
        customerRetentionRate,
        customerLifetimeValue,
        averageCustomerValue,
      },
      financialMetrics: {
        grossProfitMargin,
        netProfitMargin,
        returnOnInvestment,
        averageProfitPerOrder,
        profitTrend,
        salesTrend,
        capitalTrend,
      }
    });
  };

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Format time-based data for chart
  const formatTimeData = (data, level) => {
    const sortedEntries = Object.entries(data.sales).sort((a, b) => {
      if (level === "daily") return new Date(a[0]) - new Date(b[0]);
      if (level === "weekly") {
        const [aYear, aWeek] = a[0].split("-W");
        const [bYear, bWeek] = b[0].split("-W");
        return aYear - bYear || aWeek - bWeek;
      }
      if (level === "monthly") {
        const aDate = new Date(a[0]);
        const bDate = new Date(b[0]);
        return isNaN(aDate) || isNaN(bDate) ? 0 : aDate - bDate;
      }
      return a[0] - b[0]; // For annual
    });

    return {
      labels: sortedEntries.map(([key]) => key),
      salesData: sortedEntries.map(([, value]) => value || 0),
      capitalData: sortedEntries.map(([key]) => data.capital[key] || 0),
      profitData: sortedEntries.map(([key]) => data.profit[key] || 0),
      vatData: sortedEntries.map(([key]) => data.vat[key] || 0),
    };
  };

  // Fetch orders and products when time range changes
  useEffect(() => {
    fetchAllOrders();
    fetchProducts();
  }, [token, timeRange]);

  // Calculate analytics when orders or products change
  useEffect(() => {
    calculateAnalytics();
  }, [orders, products]);

  // Render charts
  useEffect(() => {
    if (Object.keys(analytics.orderStatusDistribution).length === 0) return;

    // Destroy previous charts
    statusChartRef.current?.destroy();
    productChartRef.current?.destroy();
    earningsChartRef.current?.destroy();
    timeAnalysisChartRef.current?.destroy();
    stockChartRef.current?.destroy();
    marginChartRef.current?.destroy();

    // Order status chart
    const statusCtx = document.getElementById("statusChart")?.getContext("2d");
    if (statusCtx) {
      statusChartRef.current = new Chart(statusCtx, {
        type: "pie",
        data: {
          labels: Object.keys(analytics.orderStatusDistribution),
          datasets: [
            {
              data: Object.values(analytics.orderStatusDistribution),
              backgroundColor: [
                "#4f46e5", // indigo-600
                "#7c3aed", // violet-600
                "#2563eb", // blue-600
                "#059669", // emerald-600
                "#dc2626", // red-600
              ],
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: "bottom",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    // Top products chart
    const productCtx = document.getElementById("productsChart")?.getContext("2d");
    if (productCtx) {
      const topProducts = Object.entries(analytics.topProducts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      productChartRef.current = new Chart(productCtx, {
        type: "bar",
        data: {
          labels: topProducts.map(([name]) => name),
          datasets: [
            {
              label: "Quantity Sold",
              data: topProducts.map(([, qty]) => qty),
              backgroundColor: "rgba(79, 70, 229, 0.8)", // indigo-600
              borderRadius: 4,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw || 0;
                  return `Quantity Sold: ${value}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Quantity"
              }
            },
            x: {
              title: {
                display: true,
                text: "Products"
              }
            }
          },
        },
      });
    }

    // Time-based analysis chart
    const timeAnalysisCtx = document.getElementById("timeAnalysisChart")?.getContext("2d");
    if (timeAnalysisCtx) {
      const timeData = formatTimeData(analytics.timeBasedAnalysis[analysisLevel], analysisLevel);

      timeAnalysisChartRef.current = new Chart(timeAnalysisCtx, {
        type: "line",
        data: {
          labels: timeData.labels,
          datasets: [
            {
              label: "Sales",
              data: timeData.salesData,
              borderColor: "#4f46e5", // indigo-600
              backgroundColor: "rgba(79, 70, 229, 0.1)",
              fill: true,
              tension: 0.4,
            },
            {
              label: "Profit",
              data: timeData.profitData,
              borderColor: "#059669", // emerald-600
              backgroundColor: "rgba(5, 150, 105, 0.1)",
              fill: true,
              tension: 0.4,
            },
            {
              label: "Capital",
              data: timeData.capitalData,
              borderColor: "#7c3aed", // violet-600
              backgroundColor: "rgba(124, 58, 237, 0.1)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) {
                    label += ": ";
                  }
                  if (context.parsed.y !== null) {
                    label += currency + (context.parsed.y?.toLocaleString?.() ?? "0");
                  }
                  return label;
                },
                footer: function (tooltipItems) {
                  if (tooltipItems.length > 1) {
                    const sales = tooltipItems.find(i => i.datasetIndex === 0)?.parsed.y || 0;
                    const profit = tooltipItems.find(i => i.datasetIndex === 1)?.parsed.y || 0;
                    const capital = tooltipItems.find(i => i.datasetIndex === 2)?.parsed.y || 0;

                    const margin = sales > 0 ? ((profit / sales) * 100).toFixed(2) : 0;
                    const roi = capital > 0 ? ((profit / capital) * 100).toFixed(2) : 0;

                    return [`Margin: ${margin}%`, `ROI: ${roi}%`];
                  }
                  return "";
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: analysisLevel.charAt(0).toUpperCase() + analysisLevel.slice(1)
              }
            },
            y: {
              title: {
                display: true,
                text: "Amount"
              },
              beginAtZero: true
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }

    // Margin and ROI chart
    const marginCtx = document.getElementById("marginChart")?.getContext("2d");
    if (marginCtx) {
      const timeData = formatTimeData(analytics.timeBasedAnalysis[analysisLevel], analysisLevel);

      marginChartRef.current = new Chart(marginCtx, {
        type: "line",
        data: {
          labels: timeData.labels,
          datasets: [
            {
              label: "Profit Margin",
              data: timeData.labels.map((_, index) => {
                const sales = timeData.salesData[index];
                const profit = timeData.profitData[index];
                return sales > 0 ? (profit / sales) * 100 : 0;
              }),
              borderColor: "#059669", // emerald-600
              backgroundColor: "rgba(5, 150, 105, 0.1)",
              fill: true,
              tension: 0.4,
            },
            {
              label: "ROI",
              data: timeData.labels.map((_, index) => {
                const capital = timeData.capitalData[index];
                const profit = timeData.profitData[index];
                return capital > 0 ? (profit / capital) * 100 : 0;
              }),
              borderColor: "#2563eb", // blue-600
              backgroundColor: "rgba(37, 99, 235, 0.1)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) {
                    label += ": ";
                  }
                  if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(2) + "%";
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: analysisLevel.charAt(0).toUpperCase() + analysisLevel.slice(1)
              }
            },
            y: {
              title: {
                display: true,
                text: "Percentage"
              },
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return value + "%";
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }

    // Stock status chart
    const stockCtx = document.getElementById("stockChart")?.getContext("2d");
    if (stockCtx && analytics.lowStockProducts.length > 0) {
      const stockData = analytics.lowStockProducts
        .map((product) => {
          const totalQuantity =
            product.variations?.reduce((sum, variation) => {
              return (
                sum +
                variation.options?.reduce((optSum, option) => {
                  return optSum + (option.quantity || 0);
                }, 0)
              );
            }, 0) ||
            product.quantity ||
            0;
          return {
            name: product.name,
            quantity: totalQuantity,
          };
        })
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 10);

      stockChartRef.current = new Chart(stockCtx, {
        type: "bar",
        data: {
          labels: stockData.map((product) => product.name),
          datasets: [
            {
              label: "Remaining Quantity",
              data: stockData.map((product) => product.quantity),
              backgroundColor: stockData.map((product) =>
                product.quantity < 5
                  ? "#dc2626" // red-600
                  : product.quantity < 10
                  ? "#d97706" // amber-600
                  : "#059669" // emerald-600
              ),
              borderRadius: 4,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw || 0;
                  const status = value < 5 ? "Critical" : value < 10 ? "Low" : "Adequate";
                  return `Quantity: ${value} (${status})`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Quantity"
              }
            },
            x: {
              title: {
                display: true,
                text: "Products"
              }
            }
          },
        },
      });
    }
  }, [analytics, analysisLevel]);

  // Cleanup charts on component unmount
  useEffect(() => {
    return () => {
      statusChartRef.current?.destroy();
      productChartRef.current?.destroy();
      earningsChartRef.current?.destroy();
      timeAnalysisChartRef.current?.destroy();
      stockChartRef.current?.destroy();
      marginChartRef.current?.destroy();
    };
  }, []);

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Order Analytics Report", 14, 15);

    // Summary Table
    doc.autoTable({
      startY: 25,
      head: [["Metric", "Value"]],
      body: [
        ["Total Sales", `${currency}${formatNumber(analytics.totalSales)}`],
        [
          "Total Capital",
          `${currency}${formatNumber(analytics.totalCombinedCapital)}`,
        ],
        [
          "  - Base Capital",
          `${currency}${formatNumber(analytics.totalCapital)}`,
        ],
        [
          "  - Additional Capital",
          `${currency}${formatNumber(analytics.totalAdditionalCapital)}`,
        ],
        ["Total Profit", `${currency}${formatNumber(analytics.totalProfit)}`],
        [
          "Profit Margin",
          `${(analytics.totalSales > 0
            ? (analytics.totalProfit / analytics.totalSales) * 100
            : 0
          ).toFixed(2)}%`,
        ],
        ["Total VAT", `${currency}${formatNumber(analytics.totalVAT)}`],
        ["VAT Percentage", `${analytics.vatPercentage.toFixed(2)}%`],
        ["Total Orders", formatNumber(analytics.totalOrders)],
        [
          "Average Order Value",
          `${currency}${(analytics.averageOrderValue || 0).toFixed(2)}`,
        ],
        [
          "Repeat Customers",
          formatNumber(analytics.customerMetrics.repeatCustomers),
        ],
      ],
    });

    // Order Status Table
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Order Status", "Count"]],
      body: Object.entries(analytics.orderStatusDistribution).map(
        ([status, count]) => [status, formatNumber(count)]
      ),
    });

    // Time-based Analysis Table
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [
        [`Time Period (${analysisLevel})`, "Sales", "Capital", "Profit", "VAT"],
      ],
      body: Object.entries(
        analytics.timeBasedAnalysis[analysisLevel].sales
      ).map(([period, sales]) => [
        period,
        `${currency}${formatNumber(sales)}`,
        `${currency}${formatNumber(
          analytics.timeBasedAnalysis[analysisLevel].capital[period] || 0
        )}`,
        `${currency}${formatNumber(
          analytics.timeBasedAnalysis[analysisLevel].profit[period] || 0
        )}`,
        `${currency}${formatNumber(
          analytics.timeBasedAnalysis[analysisLevel].vat[period] || 0
        )}`,
      ]),
    });

    // Product Sales Table (Top 10 Products)
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Product Name", "Quantity Sold"]],
      body: Object.entries(analytics.topProducts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, qty]) => [name, formatNumber(qty)]),
    });

    // Low Stock Products Table
    if (analytics.lowStockProducts.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Product Name", "Remaining Quantity", "Status"]],
        body: analytics.lowStockProducts
          .map((product) => {
            const totalQuantity =
              product.variations?.reduce((sum, variation) => {
                return (
                  sum +
                  variation.options?.reduce((optSum, option) => {
                    return optSum + (option.quantity || 0);
                  }, 0)
                );
              }, 0) ||
              product.quantity ||
              0;
            return [
              product.name,
              formatNumber(totalQuantity),
              totalQuantity < 5 ? "Critical" : "Low",
            ];
          })
          .sort((a, b) => a[1] - b[1]),
      });
    }

    // Recent Orders Table (show discount/voucher)
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Order ID", "Customer", "Products", "Subtotal", "Discount", "Voucher", "Shipping", "Total", "Status"]],
      body: orders.slice(0, 10).map((order) => {
        let subtotal = 0;
        let vat = 0;
        if (Array.isArray(order.items)) {
          order.items.forEach((item) => {
            let variationAdjustment = item.variationAdjustment || 0;
            let basePrice = (item.price || 0) + variationAdjustment;
            const discount = item.discount ? (basePrice * (item.discount / 100)) : 0;
            const finalPrice = Math.round((basePrice - discount) * 100) / 100;
            const itemTotal = Math.round((finalPrice * (item.quantity || 1)) * 100) / 100;
            subtotal = Math.round((subtotal + itemTotal) * 100) / 100;
            // VAT calculation
            const itemVATRate = (item.vat || 0) / 100;
            vat += (item.price || 0) * (item.quantity || 1) * itemVATRate;
          });
        }
        const discount = order.discountAmount || 0;
        const voucher = order.voucherAmount || 0;
        const shipping = order.shippingFee || 0;
        const total = Math.round((subtotal - discount - voucher + shipping) * 100) / 100;
        return [
          order.id || order._id || "",
          order.customerName || order.userId || "Unknown",
          order.items?.map?.((item) => item.name).join(", ") || "",
          subtotal,
          discount,
          voucher,
          shipping,
          vat,
          total,
          order.status || "Unknown",
        ];
      }),
    });

    doc.save("Order_Analytics_Report.pdf");
  };

  // Export to Excel
  const exportToExcel = () => {
    // Create worksheets
    const orderWorksheet = XLSX.utils.json_to_sheet(
      orders.map((order) => {
        let subtotal = 0;
        let vat = 0;
        if (Array.isArray(order.items)) {
          order.items.forEach((item) => {
            let variationAdjustment = item.variationAdjustment || 0;
            let basePrice = (item.price || 0) + variationAdjustment;
            const discount = item.discount ? (basePrice * (item.discount / 100)) : 0;
            const finalPrice = Math.round((basePrice - discount) * 100) / 100;
            const itemTotal = Math.round((finalPrice * (item.quantity || 1)) * 100) / 100;
            subtotal = Math.round((subtotal + itemTotal) * 100) / 100;
            // VAT calculation
            const itemVATRate = (item.vat || 0) / 100;
            vat += (item.price || 0) * (item.quantity || 1) * itemVATRate;
          });
        }
        const discount = order.discountAmount || 0;
        const voucher = order.voucherAmount || 0;
        const shipping = order.shippingFee || 0;
        const total = Math.round((subtotal - discount - voucher + shipping) * 100) / 100;
        const orderCapital =
          order.items?.reduce?.(
            (sum, item) => sum + (item.capital || 0) * (item.quantity || 0),
            0
          ) || 0;
        const orderAdditionalCapital =
          order.items?.reduce?.(
            (sum, item) =>
              sum + (item.additionalCapital || 0) * (item.quantity || 0),
            0
          ) || 0;
        const orderCombinedCapital = orderCapital + orderAdditionalCapital;
        const orderProfit = total - orderCombinedCapital - shipping;
        const orderVAT = vat;

        return {
          "Order ID": order.id || order._id || "",
          "Customer Name": order.customerName || "Unknown",
          "Product Name":
            order.items?.map?.((item) => item.name).join(", ") || "",
          Quantity:
            order.items?.reduce?.(
              (sum, item) => sum + (item.quantity || 0),
              0
            ) || 0,
          Subtotal: subtotal,
          Discount: discount,
          Voucher: voucher,
          Shipping: shipping,
          Total: total,
          "Base Capital": orderCapital,
          "Additional Capital": orderAdditionalCapital,
          "Total Capital": orderCombinedCapital,
          Profit: orderProfit,
          "Profit Margin":
            total > 0
              ? `${((orderProfit / total) * 100).toFixed(2)}%`
              : "0%",
          "VAT Amount": orderVAT,
          "VAT Percentage":
            total > 0
              ? `${((orderVAT / total) * 100).toFixed(2)}%`
              : "0%",
          Status: order.status || "Unknown",
          "Date Ordered": order.date
            ? new Date(order.date).toLocaleDateString()
            : "Unknown",
        };
      })
    );

    const analyticsWorksheet = XLSX.utils.json_to_sheet([
      {
        "Total Sales": analytics.totalSales,
        "Total Capital": analytics.totalCombinedCapital,
        "Base Capital": analytics.totalCapital,
        "Additional Capital": analytics.totalAdditionalCapital,
        "Total Profit": analytics.totalProfit,
        "Profit Margin":
          analytics.totalSales > 0
            ? `${((analytics.totalProfit / analytics.totalSales) * 100).toFixed(
                2
              )}%`
            : "0%",
        "Total VAT": analytics.totalVAT,
        "VAT Percentage": analytics.vatPercentage.toFixed(2) + "%",
        "Total Orders": analytics.totalOrders,
        "Average Order Value": analytics.averageOrderValue,
        "Repeat Customers": analytics.customerMetrics.repeatCustomers,
        "New Customers": analytics.customerMetrics.newCustomers,
      },
    ]);

    const lowStockWorksheet = XLSX.utils.json_to_sheet(
      analytics.lowStockProducts.map((product) => {
        const totalQuantity =
          product.variations?.reduce((sum, variation) => {
            return (
              sum +
              variation.options?.reduce((optSum, option) => {
                return optSum + (option.quantity || 0);
              }, 0)
            );
          }, 0) ||
          product.quantity ||
          0;
        return {
          "Product Name": product.name,
          "Remaining Quantity": totalQuantity,
          Status: totalQuantity < 5 ? "Critical" : "Low",
        };
      })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, orderWorksheet, "Orders");
    XLSX.utils.book_append_sheet(workbook, analyticsWorksheet, "Analytics");
    XLSX.utils.book_append_sheet(workbook, lowStockWorksheet, "Low Stock");
    XLSX.writeFile(workbook, "Order_Analytics.xlsx");
  };

  // Import Excel function
  const importFromExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Convert Excel data to match order schema
        const importedOrders = jsonData.map((row) => ({
          userId: row["User ID"] || "default-user-id",
          customerName: row["Customer Name"] || "Unknown",
          items: row["Product Name"]
            ? row["Product Name"].split(", ").map((name) => ({
                name,
                quantity: row["Quantity"] || 1,
                price: row["Price"] || 0,
                capital: row["Capital"] || 0,
                additionalCapital: row["Additional Capital"] || 0,
                vat: row["VAT Percentage"] || 0,
              }))
            : [],
          amount: Number(row["Price"] || 0),
          status: row["Status"] || "Order Placed",
          date: row["Date Ordered"]
            ? new Date(row["Date Ordered"]).getTime()
            : Date.now(),
          address: row["Address"] || "Unknown Address",
          paymentMethod: row["Payment Method"] || "Unknown",
          payment: row["Payment Status"]
            ? row["Payment Status"] === "Paid"
            : false,
        }));

        saveImportedOrders(importedOrders);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        toast.error("Failed to process Excel file: " + error.message);
        setCsvUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error("Error reading Excel file");
      setCsvUploading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to save imported orders to backend
  const saveImportedOrders = async (orders) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/import",
        { orders },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Orders imported successfully!");
        fetchAllOrders();
      } else {
        toast.error("Import failed: " + response.data.message);
      }
    } catch (error) {
      console.error("Error saving orders:", error);
      toast.error(
        "Failed to import orders: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setCsvUploading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvData = orders.map((order) => {
      const orderCapital =
        order.items?.reduce?.(
          (sum, item) => sum + (item.capital || 0) * (item.quantity || 0),
          0
        ) || 0;
      const orderAdditionalCapital =
        order.items?.reduce?.(
          (sum, item) =>
            sum + (item.additionalCapital || 0) * (item.quantity || 0),
          0
        ) || 0;
      const orderCombinedCapital = orderCapital + orderAdditionalCapital;
      const orderProfit = (order.amount || 0) - orderCombinedCapital;
      const orderVAT =
        order.items?.reduce?.((sum, item) => {
          const itemPrice = item.price || 0;
          const itemVATRate = (item.vat || 0) / 100;
          const quantity = item.quantity || 0;
          return sum + itemPrice * quantity * itemVATRate;
        }, 0) || 0;

      return {
        "Order ID": order.id || "",
        "Customer Name": order.customerName || "Unknown",
        "Product Name":
          order.items?.map?.((item) => item.name).join(", ") || "",
        Quantity:
          order.items?.reduce?.((sum, item) => sum + (item.quantity || 0), 0) ||
          0,
        Price: order.amount || 0,
        "Base Capital": orderCapital,
        "Additional Capital": orderAdditionalCapital,
        "Total Capital": orderCombinedCapital,
        Profit: orderProfit,
        "Profit Margin":
          order.amount > 0
            ? `${((orderProfit / order.amount) * 100).toFixed(2)}%`
            : "0%",
        "VAT Amount": orderVAT,
        "VAT Percentage":
          order.amount > 0
            ? `${((orderVAT / order.amount) * 100).toFixed(2)}%`
            : "0%",
        Status: order.status || "Unknown",
        "Date Ordered": order.date
          ? new Date(order.date).toLocaleDateString()
          : "Unknown",
      };
    });

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Order_Analytics.csv";
    link.click();
  };

  // Add at the top of the component (after useState declarations)
  const [expandedOrders, setExpandedOrders] = useState({});
  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Helper to calculate percent change for a metric
  const getPercentChange = (metricKey) => {
    const timeData = analytics.timeBasedAnalysis[analysisLevel];
    const keys = Object.keys(timeData[metricKey] || {});
    if (keys.length < 2) return null;
    const last = timeData[metricKey][keys[keys.length - 1]];
    const prev = timeData[metricKey][keys[keys.length - 2]];
    if (prev === 0 || prev === undefined) return null;
    const change = ((last - prev) / Math.abs(prev)) * 100;
    return change;
  };

  const [userCounts, setUserCounts] = useState({ admin: 0, staff: 0, user: 0 });

  useEffect(() => {
    // Fetch user counts for analytics card
    const fetchUserCounts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const response = await axios.get(`${backendUrl}/api/user/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          const users = response.data.users || [];
          const admin = users.filter(u => u.role === 'admin').length;
          const staff = users.filter(u => u.role === 'staff').length;
          const user = users.filter(u => u.role === 'user').length;
          setUserCounts({ admin, staff, user });
        }
      } catch (e) {
        // ignore error for now
      }
    };
    fetchUserCounts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 items-center justify-center p-6">
      {/* Header Section */}
      <div className="p-6 bg-[#e3e6eb] rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.08),-4px_-4px_12px_rgba(255,255,255,0.8)] border border-gray-100">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">Track your business performance</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToPDF}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Export PDF
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Export Excel
            </button>
            <label className="px-4 py-2 text-sm font-medium text-white transition-colors bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-700">
              Import Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={importFromExcel}
                disabled={csvUploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="p-6">
  <div className="flex flex-wrap items-center gap-6 p-6 bg-[#e3e6eb] rounded-3xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] border border-gray-100">

    {/* Date Pickers */}
    <div className="flex items-end gap-4">
            <div>
        <label className="block mb-1 text-[13px] font-medium text-gray-700 tracking-wide">
          Start Date
        </label>
              <DatePicker
                selected={timeRange.startDate}
                onChange={(date) => setTimeRange({ ...timeRange, startDate: date })}
                selectsStart
                startDate={timeRange.startDate}
                endDate={timeRange.endDate}
          className="w-full p-2 px-3 rounded-xl text-sm text-gray-700 bg-[#f1f3f6] shadow-inner border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
              />
            </div>
            <div>
        <label className="block mb-1 text-[13px] font-medium text-gray-700 tracking-wide">
          End Date
        </label>
              <DatePicker
                selected={timeRange.endDate}
                onChange={(date) => setTimeRange({ ...timeRange, endDate: date })}
                selectsEnd
                startDate={timeRange.startDate}
                endDate={timeRange.endDate}
                minDate={timeRange.startDate}
          className="w-full p-2 px-3 rounded-xl text-sm text-gray-700 bg-[#f1f3f6] shadow-inner border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
              />
            </div>
            <button
              onClick={fetchAllOrders}
        className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200"
            >
              Apply
            </button>
          </div>

    {/* Analysis Level */}
          <div>
      <label className="block mb-1 text-[13px] font-medium text-gray-700 tracking-wide">
        Analysis Level
      </label>
            <select
              value={analysisLevel}
              onChange={(e) => setAnalysisLevel(e.target.value)}
        className="w-full p-2 px-3 rounded-xl text-sm text-gray-700 bg-[#f1f3f6] shadow-inner border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

        </div>
      </div>


      {/* Main Content */}
      <div className="p-6">
        {/* Unified Summary & Financial Grid */}
        <div className="p-6">
        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Sales Card - Neumorphic/Glassy Style */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                {/* Header: Label + Icon */}
                <div className="flex items-center justify-between">
                  {/* Glassy Label */}
                  <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">Total Sales</div>
                  {/* 3D Icon */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#e5e8ed] to-[#f9fafc] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05),inset_-1px_-1px_2px_rgba(255,255,255,0.8),4px_4px_8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-[1.05]">
                    <svg className="w-5 h-5 text-indigo-400 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
                </div>
                <div>
                   {/* Main Value */}
                <span className="text-[32px] leading-[1.1] font-extrabold text-gray-900 tracking-tight">
              {currency}{formatNumber(analytics.totalSales)}
                </span>
                {/* Subtext: Gross Margin */}
                <div className="text-[11px] text-gray-500 italic leading-snug">
              {analytics.financialMetrics.grossProfitMargin.toFixed(2)}% Gross Margin
                </div>
                </div>
               
                {/* VS LAST PERIOD */}
                {(() => { const change = getPercentChange('sales'); return change !== null ? (
                  <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
                  </div>
                ) : null; })()}
              </div>
          </div>

          {/* Total Profit Card */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">Total Profit</div>
                <span className=" p-2 border border-gray-300 bg-gray-100 rounded-full shadow-md">
                  <svg className=" w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
            </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{currency}{formatNumber(analytics.totalProfit)}</div>
                <div className="text-[11px] text-gray-500 italic leading-snug">{analytics.financialMetrics.returnOnInvestment.toFixed(2)}% ROI</div>
                {/* VS LAST PERIOD */}
                {(() => {
                  const change = getPercentChange('profit'); return change !== null ? (
                    <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
                    </div>
                  ) : null;
                })()}
              </div>
              </div>
          </div>

          {/* Customer Metrics Card */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">Customer Metrics</div>
                <span className=" p-2 border border-gray-300 bg-gray-100 rounded-full shadow-md">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
            </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{formatNumber(analytics.customerMetrics.repeatCustomers)} Repeat</div>
                <div className="text-[11px] text-gray-500 italic leading-snug">{analytics.customerMetrics.customerRetentionRate.toFixed(2)}% Retention</div>
                {/* VS LAST PERIOD */}
                {(() => {
                  const change = getPercentChange('repeatCustomers'); return change !== null ? (
                    <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
                    </div>
                  ) : null;
                })()}
              </div>
              </div>
          </div>

          {/* Order Metrics Card */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">Order Metrics</div>
                <span className=" p-2 border border-gray-300 bg-gray-100 rounded-full shadow-md">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </span>
            </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{formatNumber(analytics.totalOrders)} Orders</div>
                <div className="text-[11px] text-gray-500 italic leading-snug">{currency}{formatNumber(analytics.averageOrderValue)} Avg. Order</div>
                {/* VS LAST PERIOD */}
                {(() => {
                  const change = getPercentChange('totalOrders'); return change !== null ? (
                    <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
          </div>
                  ) : null;
                })()}
              </div>
              </div>
            </div>

            {/* Total Capital */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">Total Capital</div>
                <span className=" p-2 border border-gray-300 bg-gray-100 rounded-full shadow-md">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{currency}{formatNumber(Number(analytics.totalCapital) || 0)}</div>
                <div className="text-[11px] text-gray-500 italic leading-snug">VS LAST PERIOD</div>
                {/* VS LAST PERIOD */}
                {(() => {
                  const change = getPercentChange('capital'); return change !== null ? (
                    <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
                    </div>
                  ) : null;
                })()}
              </div>
              </div>
            </div>
            {/* Markup */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">Markup</div>
                <span className=" p-2 border border-gray-300 bg-gray-100 rounded-full shadow-md">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 10c-4.418 0-8-1.79-8-4V6a2 2 0 012-2h12a2 2 0 012 2v8c0 2.21-3.582 4-8 4z" /></svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{currency}{formatNumber(Number(analytics.totalAdditionalCapital) || 0)}</div>
                <div className="text-[11px] text-gray-500 italic leading-snug">VS LAST PERIOD</div>
                {/* VS LAST PERIOD */}
                {(() => {
                  const change = getPercentChange('additionalCapital'); return change !== null ? (
                    <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
                    </div>
                  ) : null;
                })()}
              </div>
              </div>
            </div>
            {/* Combined Capital */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">Combined Capital</div>
                <span className=" p-2 border border-gray-300 bg-gray-100 rounded-full shadow-md">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a5 5 0 00-10 0v2M5 9h14l1 12H4L5 9z" /></svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{currency}{formatNumber(Number(analytics.totalCombinedCapital) || 0)}</div>
                <div className="text-[11px] text-gray-500 italic leading-snug">VS LAST PERIOD</div>
                {/* VS LAST PERIOD */}
                {(() => {
                  const change = getPercentChange('combinedCapital'); return change !== null ? (
                    <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
                    </div>
                  ) : null;
                })()}
              </div>
              </div>
            </div>
            {/* Shipping Fee */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">Shipping Fee</div>
                <span className=" p-2 border border-gray-300 bg-gray-100 rounded-full shadow-md">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{currency}{formatNumber(Number(analytics.totalShippingFee) || 0)}</div>
                <div className="text-[11px] text-gray-500 italic leading-snug">VS LAST PERIOD</div>
                {/* VS LAST PERIOD */}
                {(() => {
                  const change = getPercentChange('shippingFee'); return change !== null ? (
                    <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            </div>
            {/* ROI */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">
                
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">ROI</div>
                <span className=" p-2 border border-gray-300 bg-gray-100 rounded-full shadow-md">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{Number(analytics.totalCombinedCapital) > 0 ? ((Number(analytics.totalProfit) / Number(analytics.totalCombinedCapital)) * 100).toFixed(2) : '0.00'}%</div>
                <div className="text-[11px] text-gray-500 italic leading-snug">VS LAST PERIOD</div>
                {/* VS LAST PERIOD */}
                {(() => {
                  const change = getPercentChange('roi'); return change !== null ? (
                    <div className={`font-bold text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? '▲' : '▼'} <span className="ml-1">VS LAST PERIOD: {Math.abs(change).toFixed(2)}%</span>
                    </div>
                  ) : null;
                })()}
              </div>
              </div>
            </div>

            {/* User Count Card Only */}
            <div className="p-2 rounded-3xl bg-[#e3e6eb] shadow-[6px_6px_16px_rgba(0,0,0,0.1),-6px_-6px_16px_rgba(255,255,255,0.9)] h-full max-w-xs w-full">
              <div className="bg-[#e3e6eb] h-full rounded-3xl shadow-[inset_6px_6px_12px_rgba(0,0,0,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] p-5 min-h-[130px] flex flex-col justify-between font-sans gap-4 border border-gray-100 transition-all duration-300 hover:scale-[1.01]">

                {/* Header: Label + Icon */}
                <div className="flex items-center justify-between">

                  {/* Glassy Label */}
                  <div className="text-[13px] font-bold text-gray-800 tracking-[0.15em] uppercase">
                    User
                  </div>

                  {/* 3D Icon */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center 
                      bg-gradient-to-tr from-[#e5e8ed] to-[#f9fafc] 
                      shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05),inset_-1px_-1px_2px_rgba(255,255,255,0.8),4px_4px_8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-[1.05]">
                    <FaUser className="w-5 h-5 text-gray-600 drop-shadow-sm" />
                  </div>
                </div>

                {/* Main User Count */}
                <span className="text-[32px] leading-[1.1] font-extrabold text-gray-900 tracking-tight">
                  {userCounts.user}
                </span>

                {/* Optional status message */}
                <div className="text-[11px] text-gray-500 italic leading-snug">
                  {/* e.g. "Active this week" or leave empty */}
                </div>

              </div>
            </div>







          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          <details className="mt-6 text-xs text-gray-600 bg-white rounded p-4 shadow cursor-pointer select-none">
            <summary className="font-semibold text-gray-700 mb-2">Show Formulas</summary>
            <div className="mt-2">
              <div><strong>Formulas:</strong></div>
              <div>Total Combined Capital = Total Capital + Total Additional Capital (markup)</div>
              <div>Total Profit = Total Sales - Total Combined Capital - Total Shipping Fee</div>
              <div>ROI = (Total Profit / Total Combined Capital) × 100</div>
            </div>

          </details>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          {/* Sales Trend Chart */}
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Sales Trend</h3>
            <canvas id="timeAnalysisChart" className="w-full aspect-[4/3]"></canvas>
          </div>

          {/* Margin and ROI Chart */}
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Margin & ROI</h3>
            <canvas id="marginChart" className="w-full aspect-[4/3]"></canvas>
          </div>
        </div>

        {/* Additional Charts Grid */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          {/* Order Status Chart */}
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Order Status</h3>
            <canvas id="statusChart" className="w-full aspect-[4/3]"></canvas>
          </div>

          {/* Top Products Chart */}
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Top Products</h3>
            <canvas id="productsChart" className="w-full aspect-[4/3]"></canvas>
          </div>
        </div>

        {/* Low Stock Products Section */}
        {analytics.lowStockProducts.length > 0 && (
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Low Stock Products</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Product Name</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Remaining Quantity</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.lowStockProducts
                    .sort((a, b) => {
                      const aQty = a.variations?.reduce((sum, v) => sum + v.options?.reduce((s, o) => s + (o.quantity || 0), 0), 0) || a.quantity || 0;
                      const bQty = b.variations?.reduce((sum, v) => sum + v.options?.reduce((s, o) => s + (o.quantity || 0), 0), 0) || b.quantity || 0;
                      return aQty - bQty;
                    })
                    .slice(0, 10)
                    .map((product) => {
                      const totalQuantity = product.variations?.reduce((sum, variation) => {
                        return sum + variation.options?.reduce((optSum, option) => optSum + (option.quantity || 0), 0);
                      }, 0) || product.quantity || 0;
                      const status = totalQuantity < 5 ? "Critical" : "Low";

                      return (
                        <tr key={product._id || Math.random()} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status === "Critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {formatNumber(totalQuantity)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status === "Critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Orders Section */}
        <div className="p-6 bg-white rounded-xl shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Products</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Subtotal</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Voucher</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Shipping</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">VAT</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total Weight (kg)</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Per Kilo Rate</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Region Fee</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Shipping Formula</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.slice(0, 10).map((order) => {
                  let subtotal = 0;
                  let vat = 0;
                  let totalWeight = 0;
                  let perKiloRate = 100; // Default, ideally fetch from backend
                  let regionFee = order.regionFee || 0; // Use from order if available
                  let itemBreakdown = [];
                  if (Array.isArray(order.items)) {
                    order.items.forEach((item) => {
                      const capital = item.capital || 0;
                      let markup = 0;
                      if (item.additionalCapital) {
                        if (item.additionalCapital.type === 'percent') {
                          markup = capital * (item.additionalCapital.value / 100);
                        } else {
                          markup = item.additionalCapital.value || 0;
                        }
                      }
                      const subtotalBase = capital + markup;
                      const vatPercent = item.vat || 0;
                      const vatAmount = subtotalBase * (vatPercent / 100);
                      const basePrice = subtotalBase + vatAmount;
                      const variationAdjustment = item.variationAdjustment || 0;
                      const discountPercent = item.discount || 0;
                      const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
                      const priceWithVariation = basePrice + variationAdjustment;
                      const finalPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
                      const itemTotal = Math.round((finalPrice * (item.quantity || 1)) * 100) / 100;
                      subtotal = Math.round((subtotal + itemTotal) * 100) / 100;
                      vat += vatAmount * (item.quantity || 1);
                      totalWeight += (item.weight || 0) * (item.quantity || 1);
                      itemBreakdown.push({
                        name: item.name,
                        capital,
                        markup,
                        subtotalBase,
                        vatPercent,
                        vatAmount,
                        basePrice,
                        variationAdjustment,
                        discountPercent,
                        discountedPrice,
                        priceWithVariation,
                        finalPrice,
                        quantity: item.quantity || 1,
                        itemTotal
                      });
                    });
                  }
                  const discount = order.discountAmount || 0;
                  const voucher = order.voucherAmount || 0;
                  const shipping = order.shippingFee || 0;
                  const total = Math.round((subtotal - discount - voucher + shipping + regionFee) * 100) / 100;
                  const shippingFormula = `(${totalWeight.toFixed(2)}kg x ${perKiloRate}) + ${regionFee} = ${((totalWeight * perKiloRate) + regionFee).toLocaleString()}`;
                  return (
                    <React.Fragment key={order._id || Math.random()}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 cursor-pointer" onClick={() => toggleExpand(order._id)} title="Click to expand/collapse breakdown">{order._id?.slice(-6) || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.userId || "Unknown"}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{order.items?.map?.((item) => item.name).join(", ") || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{currency}{subtotal.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-red-600">-{currency}{discount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-red-600">-{currency}{voucher.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{currency}{shipping.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{currency}{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{totalWeight.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{currency}{perKiloRate}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{currency}{regionFee}</td>
                        <td className="px-6 py-4 text-xs text-gray-700">{shippingFormula}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-bold">{currency}{total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === "Delivered" ? "bg-green-100 text-green-800" :
                        order.status === "Processing" ? "bg-blue-100 text-blue-800" :
                        order.status === "Canceled" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status || "Unknown"}
                      </span>
                    </td>
                      </tr>
                      {expandedOrders[order._id] && (
                        <tr className="bg-blue-50">
                          <td colSpan={14} className="px-8 py-4">
                            <div className="mb-2 font-semibold text-blue-700">Computation Breakdown</div>
                            <div className="mb-2">
                              <strong>Items:</strong>
                              <table className="min-w-full text-xs mt-2 mb-2">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Capital</th>
                                    <th>Markup</th>
                                    <th>Base+Markup</th>
                                    <th>VAT (%)</th>
                                    <th>VAT Amt</th>
                                    <th>Base+VAT</th>
                                    <th>Variation Adj.</th>
                                    <th>Discount (%)</th>
                                    <th>Final Price</th>
                                    <th>Qty</th>
                                    <th>Item Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {itemBreakdown.map((b, idx) => (
                                    <tr key={idx}>
                                      <td>{b.name}</td>
                                      <td>{currency}{b.capital.toLocaleString()}</td>
                                      <td>{currency}{b.markup.toLocaleString()}</td>
                                      <td>{currency}{b.subtotalBase.toLocaleString()}</td>
                                      <td>{b.vatPercent}%</td>
                                      <td>{currency}{b.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td>{currency}{b.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td>{currency}{b.variationAdjustment.toLocaleString()}</td>
                                      <td>{b.discountPercent}%</td>
                                      <td>{currency}{b.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td>{b.quantity}</td>
                                      <td>{currency}{b.itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 ga p-2 border border-gray-300 text-sm">
                              <div><strong>Subtotal:</strong> {currency}{subtotal.toLocaleString()}</div>
                              <div><strong>Discount:</strong> -{currency}{discount.toLocaleString()}</div>
                              <div><strong>Voucher:</strong> -{currency}{voucher.toLocaleString()}</div>
                              <div><strong>Shipping Fee:</strong> {currency}{shipping.toLocaleString()}</div>
                              <div><strong>VAT:</strong> {currency}{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              <div><strong>Region Fee:</strong> {currency}{regionFee.toLocaleString()}</div>
                              <div className="col-span-2 md:col-span-3"><strong>Final Total:</strong> <span className="font-bold text-blue-900">{currency}{total.toLocaleString()}</span></div>
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
      </div>

      <ViewersTracker />
      <Review />
    </div>
  );
};

export default OrderAnalytics;
