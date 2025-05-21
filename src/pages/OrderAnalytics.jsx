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
const OrderAnalytics = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
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
      daily: { sales: {}, capital: {}, profit: {}, vat: {} },
      weekly: { sales: {}, capital: {}, profit: {}, vat: {} },
      monthly: { sales: {}, capital: {}, profit: {}, vat: {} },
      annually: { sales: {}, capital: {}, profit: {}, vat: {} }
    },
    averageOrderValue: 0,
    customerMetrics: {
      repeatCustomers: 0,
      newCustomers: 0,
      averagePurchaseFrequency: 0
    }
  });

  const [timeRange, setTimeRange] = useState({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    endDate: new Date()
  });
  const [analysisLevel, setAnalysisLevel] = useState("monthly");
  const [csvUploading, setCsvUploading] = useState(false);

  // Chart references
  const statusChartRef = useRef(null);
  const productChartRef = useRef(null);
  const earningsChartRef = useRef(null);
  const timeAnalysisChartRef = useRef(null);
  const stockChartRef = useRef(null);

  // Safe number formatting function
  const formatNumber = (num) => {
    return num?.toLocaleString?.() ?? '0';
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
        const filteredOrders = response.data.orders
          ?.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= timeRange.startDate && orderDate <= timeRange.endDate;
          }) || [];
        setOrders(filteredOrders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders: " + (error.response?.data?.message || error.message));
    }
  };

  // Fetch products from backend
  const fetchProducts = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products: " + (error.response?.data?.message || error.message));
    }
  };

  // Calculate analytics with time-based analysis
  const calculateAnalytics = () => {
    // Filter out cancelled orders
    const validOrders = orders.filter(order => order.status !== "Canceled");
    const cancelledOrders = orders.length - validOrders.length;

    // Identify low stock products (quantity < 10)
    const lowStockProducts = products.filter(product => {
      const totalQuantity = product.variations?.reduce((sum, variation) => {
        return sum + variation.options?.reduce((optSum, option) => {
          return optSum + (option.quantity || 0);
        }, 0);
      }, 0) || product.quantity || 0;
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
          daily: { sales: {}, capital: {}, profit: {}, vat: {} },
          weekly: { sales: {}, capital: {}, profit: {}, vat: {} },
          monthly: { sales: {}, capital: {}, profit: {}, vat: {} },
          annually: { sales: {}, capital: {}, profit: {}, vat: {} }
        },
        averageOrderValue: 0,
        customerMetrics: {
          repeatCustomers: 0,
          newCustomers: 0,
          averagePurchaseFrequency: 0
        }
        
      });
      
      return;
      
    }

    let totalSales = 0;
    let totalCapital = 0;
    let totalAdditionalCapital = 0;
    let totalVariationAdjustment = 0;
    let totalVAT = 0;
    const totalOrders = validOrders.length;

    const orderStatusDistribution = {};
    const topProducts = {};
    const timeBasedAnalysis = {
      daily: { sales: {}, capital: {}, profit: {}, vat: {} },
      weekly: { sales: {}, capital: {}, profit: {}, vat: {} },
      monthly: { sales: {}, capital: {}, profit: {}, vat: {} },
      annually: { sales: {}, capital: {}, profit: {}, vat: {} }
    };

    const customerOrders = {};
    const customerFirstPurchase = {};

    validOrders.forEach((order) => {
      if (!order) return;

      // Order status count
      orderStatusDistribution[order.status] = (orderStatusDistribution[order.status] || 0) + 1;

      // Product sales count
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item && item.name) {
            topProducts[item.name] = (topProducts[item.name] || 0) + (item.quantity || 0);
          }
        });
      }

      // Calculate order values
      let orderCapital = 0;
      let orderAdditionalCapital = 0;
      let orderVAT = 0;
      let orderVariationAdjustment = 0;
      const orderAmount = order.amount || 0;
      totalSales += orderAmount;

      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemVariationAdjustment = item.variationAdjustment || 0;
          const itemCapital = item.capital || 0;
          const itemAdditionalCapital = item.additionalCapital?.value || 0;
        
          const quantity = item.quantity || 0;
          
          orderCapital += itemCapital * quantity;
          orderAdditionalCapital += itemAdditionalCapital * quantity;
          orderVariationAdjustment += itemVariationAdjustment * quantity;
          // Calculate VAT for this item (as percentage of item price)
          const itemPrice = item.price  || 0;
          const itemVATRate = (item.vat || 0) / 100;
          orderVAT += (itemPrice * quantity * itemVATRate);
        });
      }
      console.log("orderVariationAdjustment: ", orderVariationAdjustment);

      totalCapital += orderCapital;
      totalAdditionalCapital += orderAdditionalCapital + orderVariationAdjustment;
      totalVAT += orderVAT;
      totalVariationAdjustment += orderVariationAdjustment;

      const orderCombinedCapital = orderCapital + orderAdditionalCapital;
      const orderProfit = orderAmount - orderCombinedCapital;

      // Time-based analysis
      const orderDate = new Date(order.date);
      if (isNaN(orderDate)) return;

      // Daily analysis (YYYY-MM-DD)
      const dayKey = orderDate.toISOString().split('T')[0];
      timeBasedAnalysis.daily.sales[dayKey] = (timeBasedAnalysis.daily.sales[dayKey] || 0) + orderAmount;
      timeBasedAnalysis.daily.capital[dayKey] = (timeBasedAnalysis.daily.capital[dayKey] || 0) + orderCombinedCapital;
      timeBasedAnalysis.daily.profit[dayKey] = (timeBasedAnalysis.daily.profit[dayKey] || 0) + orderProfit;
      timeBasedAnalysis.daily.vat[dayKey] = (timeBasedAnalysis.daily.vat[dayKey] || 0) + orderVAT;

      // Weekly analysis (YYYY-WW)
      const weekNumber = getWeekNumber(orderDate);
      const weekKey = `${orderDate.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
      timeBasedAnalysis.weekly.sales[weekKey] = (timeBasedAnalysis.weekly.sales[weekKey] || 0) + orderAmount;
      timeBasedAnalysis.weekly.capital[weekKey] = (timeBasedAnalysis.weekly.capital[weekKey] || 0) + orderCombinedCapital;
      timeBasedAnalysis.weekly.profit[weekKey] = (timeBasedAnalysis.weekly.profit[weekKey] || 0) + orderProfit;
      timeBasedAnalysis.weekly.vat[weekKey] = (timeBasedAnalysis.weekly.vat[weekKey] || 0) + orderVAT;

      // Monthly analysis (YYYY-MM)
      const monthKey = orderDate.toLocaleString('default', { year: 'numeric', month: 'long' });
      timeBasedAnalysis.monthly.sales[monthKey] = (timeBasedAnalysis.monthly.sales[monthKey] || 0) + orderAmount;
      timeBasedAnalysis.monthly.capital[monthKey] = (timeBasedAnalysis.monthly.capital[monthKey] || 0) + orderCombinedCapital;
      timeBasedAnalysis.monthly.profit[monthKey] = (timeBasedAnalysis.monthly.profit[monthKey] || 0) + orderProfit;
      timeBasedAnalysis.monthly.vat[monthKey] = (timeBasedAnalysis.monthly.vat[monthKey] || 0) + orderVAT;

      // Annual analysis (YYYY)
      const yearKey = orderDate.getFullYear().toString();
      timeBasedAnalysis.annually.sales[yearKey] = (timeBasedAnalysis.annually.sales[yearKey] || 0) + orderAmount;
      timeBasedAnalysis.annually.capital[yearKey] = (timeBasedAnalysis.annually.capital[yearKey] || 0) + orderCombinedCapital;
      timeBasedAnalysis.annually.profit[yearKey] = (timeBasedAnalysis.annually.profit[yearKey] || 0) + orderProfit;
      timeBasedAnalysis.annually.vat[yearKey] = (timeBasedAnalysis.annually.vat[yearKey] || 0) + orderVAT;

      // Customer metrics
      if (order.userId) {
        customerOrders[order.userId] = (customerOrders[order.userId] || 0) + 1;
        if (!customerFirstPurchase[order.userId]) {
          customerFirstPurchase[order.userId] = orderDate;
        }
      }
    });

    // Calculate customer metrics
    const customerCount = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const newCustomers = customerCount - repeatCustomers;
    const averagePurchaseFrequency = customerCount > 0 
      ? totalOrders / customerCount 
      : 0;

    const totalCombinedCapital = totalCapital ;
    const totalProfit = totalAdditionalCapital + totalVariationAdjustment ;
    console.log("Total Profit: ", totalProfit);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const vatPercentage = totalCapital > 0 
      ? (totalVAT / totalCapital) * 100 
      : 0;

    setAnalytics({
      totalSales,
      totalCapital,
      totalAdditionalCapital,
      totalCombinedCapital,
      totalVariationAdjustment,
      totalProfit,
      totalVAT,
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
        averagePurchaseFrequency
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
      if (level === 'daily') return new Date(a[0]) - new Date(b[0]);
      if (level === 'weekly') {
        const [aYear, aWeek] = a[0].split('-W');
        const [bYear, bWeek] = b[0].split('-W');
        return aYear - bYear || aWeek - bWeek;
      }
      if (level === 'monthly') {
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
      vatData: sortedEntries.map(([key]) => data.vat[key] || 0)
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

    // Order status chart
    const statusCtx = document.getElementById("statusChart")?.getContext("2d");
    if (statusCtx) {
      statusChartRef.current = new Chart(statusCtx, {
        type: "pie",
        data: {
          labels: Object.keys(analytics.orderStatusDistribution),
          datasets: [{
            data: Object.values(analytics.orderStatusDistribution),
            backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0", "#9966ff"],
          }],
        },
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
          datasets: [{
            label: "Quantity Sold",
            data: topProducts.map(([, qty]) => qty),
            backgroundColor: "#36a2eb",
          }],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // Stock status chart
    const stockCtx = document.getElementById("stockChart")?.getContext("2d");
    if (stockCtx && analytics.lowStockProducts.length > 0) {
      const stockData = analytics.lowStockProducts.map(product => {
        const totalQuantity = product.variations?.reduce((sum, variation) => {
          return sum + variation.options?.reduce((optSum, option) => {
            return optSum + (option.quantity || 0);
          }, 0);
        }, 0) || product.quantity || 0;
        return {
          name: product.name,
          quantity: totalQuantity
        };
      }).sort((a, b) => a.quantity - b.quantity).slice(0, 10);

      stockChartRef.current = new Chart(stockCtx, {
        type: "bar",
        data: {
          labels: stockData.map(product => product.name),
          datasets: [{
            label: "Remaining Quantity",
            data: stockData.map(product => product.quantity),
            backgroundColor: stockData.map(product => 
              product.quantity < 5 ? '#ff6384' : 
              product.quantity < 10 ? '#ffcd56' : 
              '#4bc0c0'
            ),
          }],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
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
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "#36a2eb",
              fill: true,
              tension: 0.1
            },
            {
              label: "Capital",
              data: timeData.capitalData,
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "#ff6384",
              fill: true,
              tension: 0.1
            },
            {
              label: "Profit",
              data: timeData.profitData,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "#4bc0c0",
              fill: true,
              tension: 0.1
            },
            {
              label: "VAT",
              data: timeData.vatData,
              backgroundColor: "rgba(153, 102, 255, 0.2)",
              borderColor: "#9966ff",
              fill: true,
              tension: 0.1
            }
          ],
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += currency + (context.parsed.y?.toLocaleString?.() ?? '0');
                  }
                  return label;
                },
                footer: function(tooltipItems) {
                  if (tooltipItems.length > 1) {
                    const sales = tooltipItems.find(i => i.datasetIndex === 0)?.parsed.y || 0;
                    const capital = tooltipItems.find(i => i.datasetIndex === 1)?.parsed.y || 0;
                    const profit = tooltipItems.find(i => i.datasetIndex === 2)?.parsed.y || 0;
                    const vat = tooltipItems.find(i => i.datasetIndex === 3)?.parsed.y || 0;
                    
                    const margin = sales > 0 ? (profit / sales * 100).toFixed(2) : 0;
                    const vatRate = sales > 0 ? (vat / sales * 100).toFixed(2) : 0;
                    
                    return [
                      `Margin: ${margin}%`,
                      `VAT Rate: ${vatRate}%`
                    ];
                  }
                  return '';
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
          }
        }
      });
    }
  }, [analytics, analysisLevel]);

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
        ["Total Capital", `${currency}${formatNumber(analytics.totalCombinedCapital)}`],
        ["  - Base Capital", `${currency}${formatNumber(analytics.totalCapital)}`],
        ["  - Additional Capital", `${currency}${formatNumber(analytics.totalAdditionalCapital)}`],
        ["Total Profit", `${currency}${formatNumber(analytics.totalProfit)}`],
        ["Profit Margin", `${(analytics.totalSales > 0 ? (analytics.totalProfit / analytics.totalSales * 100) : 0).toFixed(2)}%`],
        ["Total VAT", `${currency}${formatNumber(analytics.totalVAT)}`],
        ["VAT Percentage", `${analytics.vatPercentage.toFixed(2)}%`],
        ["Total Orders", formatNumber(analytics.totalOrders)],
        ["Average Order Value", `${currency}${(analytics.averageOrderValue || 0).toFixed(2)}`],
        ["Repeat Customers", formatNumber(analytics.customerMetrics.repeatCustomers)],
      ],
    });

    // Order Status Table
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Order Status", "Count"]],
      body: Object.entries(analytics.orderStatusDistribution).map(([status, count]) => [status, formatNumber(count)]),
    });

    // Time-based Analysis Table
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [[`Time Period (${analysisLevel})`, "Sales", "Capital", "Profit", "VAT"]],
      body: Object.entries(analytics.timeBasedAnalysis[analysisLevel].sales).map(([period, sales]) => [
        period,
        `${currency}${formatNumber(sales)}`,
        `${currency}${formatNumber(analytics.timeBasedAnalysis[analysisLevel].capital[period] || 0)}`,
        `${currency}${formatNumber(analytics.timeBasedAnalysis[analysisLevel].profit[period] || 0)}`,
        `${currency}${formatNumber(analytics.timeBasedAnalysis[analysisLevel].vat[period] || 0)}`
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
          .map(product => {
            const totalQuantity = product.variations?.reduce((sum, variation) => {
              return sum + variation.options?.reduce((optSum, option) => {
                return optSum + (option.quantity || 0);
              }, 0);
            }, 0) || product.quantity || 0;
            return [
              product.name,
              formatNumber(totalQuantity),
              totalQuantity < 5 ? 'Critical' : 'Low'
            ];
          })
          .sort((a, b) => a[1] - b[1]),
      });
    }

    doc.save("Order_Analytics_Report.pdf");
  };

  // Export to Excel
  const exportToExcel = () => {
    // Create worksheets
    const orderWorksheet = XLSX.utils.json_to_sheet(orders.map(order => {
      const orderCapital = order.items?.reduce?.((sum, item) => 
        sum + (item.capital || 0) * (item.quantity || 0), 0) || 0;
      const orderAdditionalCapital = order.items?.reduce?.((sum, item) => 
        sum + (item.additionalCapital || 0) * (item.quantity || 0), 0) || 0;
      const orderCombinedCapital = orderCapital + orderAdditionalCapital;
      const orderProfit = (order.amount || 0) - orderCombinedCapital;
      const orderVAT = order.items?.reduce?.((sum, item) => {
        const itemPrice = item.price || 0;
        const itemVATRate = (item.vat || 0) / 100;
        const quantity = item.quantity || 0;
        return sum + (itemPrice * quantity * itemVATRate);
      }, 0) || 0;
      
      return {
        "Order ID": order.id || '',
        "Customer Name": order.customerName || 'Unknown',
        "Product Name": order.items?.map?.(item => item.name).join(", ") || '',
        "Quantity": order.items?.reduce?.((sum, item) => sum + (item.quantity || 0), 0) || 0,
        "Price": order.amount || 0,
        "Base Capital": orderCapital,
        "Additional Capital": orderAdditionalCapital,
        "Total Capital": orderCombinedCapital,
        "Profit": orderProfit,
        "Profit Margin": order.amount > 0 ? `${(orderProfit / order.amount * 100).toFixed(2)}%` : "0%",
        "VAT Amount": orderVAT,
        "VAT Percentage": order.amount > 0 ? `${(orderVAT / order.amount * 100).toFixed(2)}%` : "0%",
        "Status": order.status || 'Unknown',
        "Date Ordered": order.date ? new Date(order.date).toLocaleDateString() : 'Unknown',
      };
    }));

    const analyticsWorksheet = XLSX.utils.json_to_sheet([{
      "Total Sales": analytics.totalSales,
      "Total Capital": analytics.totalCombinedCapital,
      "Base Capital": analytics.totalCapital,
      "Additional Capital": analytics.totalAdditionalCapital,
      "Total Profit": analytics.totalProfit,
      "Profit Margin": analytics.totalSales > 0 ? `${(analytics.totalProfit / analytics.totalSales * 100).toFixed(2)}%` : "0%",
      "Total VAT": analytics.totalVAT,
      "VAT Percentage": analytics.vatPercentage.toFixed(2) + "%",
      "Total Orders": analytics.totalOrders,
      "Average Order Value": analytics.averageOrderValue,
      "Repeat Customers": analytics.customerMetrics.repeatCustomers,
      "New Customers": analytics.customerMetrics.newCustomers
    }]);

    const lowStockWorksheet = XLSX.utils.json_to_sheet(analytics.lowStockProducts.map(product => {
      const totalQuantity = product.variations?.reduce((sum, variation) => {
        return sum + variation.options?.reduce((optSum, option) => {
          return optSum + (option.quantity || 0);
        }, 0);
      }, 0) || product.quantity || 0;
      return {
        "Product Name": product.name,
        "Remaining Quantity": totalQuantity,
        "Status": totalQuantity < 5 ? 'Critical' : 'Low'
      };
    }));

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
        const importedOrders = jsonData.map(row => ({
          userId: row["User ID"] || "default-user-id",
          customerName: row["Customer Name"] || "Unknown",
          items: row["Product Name"] 
            ? row["Product Name"].split(", ").map(name => ({ 
                name, 
                quantity: row["Quantity"] || 1,
                price: row["Price"] || 0,
                capital: row["Capital"] || 0,
                additionalCapital: row["Additional Capital"] || 0,
                vat: row["VAT Percentage"] || 0
              }))
            : [],
          amount: Number(row["Price"] || 0),
          status: row["Status"] || "Order Placed",
          date: row["Date Ordered"] ? new Date(row["Date Ordered"]).getTime() : Date.now(),
          address: row["Address"] || "Unknown Address",
          paymentMethod: row["Payment Method"] || "Unknown",
          payment: row["Payment Status"] ? row["Payment Status"] === "Paid" : false,
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
      toast.error("Failed to import orders: " + (error.response?.data?.message || error.message));
    } finally {
      setCsvUploading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvData = orders.map((order) => {
      const orderCapital = order.items?.reduce?.((sum, item) => 
        sum + (item.capital || 0) * (item.quantity || 0), 0) || 0;
      const orderAdditionalCapital = order.items?.reduce?.((sum, item) => 
        sum + (item.additionalCapital || 0) * (item.quantity || 0), 0) || 0;
      const orderCombinedCapital = orderCapital + orderAdditionalCapital;
      const orderProfit = (order.amount || 0) - orderCombinedCapital;
      const orderVAT = order.items?.reduce?.((sum, item) => {
        const itemPrice = item.price || 0;
        const itemVATRate = (item.vat || 0) / 100;
        const quantity = item.quantity || 0;
        return sum + (itemPrice * quantity * itemVATRate);
      }, 0) || 0;
      
      return {
        "Order ID": order.id || '',
        "Customer Name": order.customerName || 'Unknown',
        "Product Name": order.items?.map?.(item => item.name).join(", ") || '',
        "Quantity": order.items?.reduce?.((sum, item) => sum + (item.quantity || 0), 0) || 0,
        "Price": order.amount || 0,
        "Base Capital": orderCapital,
        "Additional Capital": orderAdditionalCapital,
        "Total Capital": orderCombinedCapital,
        "Profit": orderProfit,
        "Profit Margin": order.amount > 0 ? `${(orderProfit / order.amount * 100).toFixed(2)}%` : "0%",
        "VAT Amount": orderVAT,
        "VAT Percentage": order.amount > 0 ? `${(orderVAT / order.amount * 100).toFixed(2)}%` : "0%",
        "Status": order.status || 'Unknown',
        "Date Ordered": order.date ? new Date(order.date).toLocaleDateString() : 'Unknown',
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

  return (
    <div className="p-4 md:p-8 lg:p-10">
      <h3 className="mb-6 text-2xl font-bold text-center md:text-3xl">Order Analytics</h3>

      {/* Time Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Start Date</label>
            <DatePicker
              selected={timeRange.startDate}
              onChange={(date) => setTimeRange({...timeRange, startDate: date})}
              selectsStart
              startDate={timeRange.startDate}
              endDate={timeRange.endDate}
              className="p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">End Date</label>
            <DatePicker
              selected={timeRange.endDate}
              onChange={(date) => setTimeRange({...timeRange, endDate: date})}
              selectsEnd
              startDate={timeRange.startDate}
              endDate={timeRange.endDate}
              minDate={timeRange.startDate}
              className="p-2 border rounded"
            />
          </div>
          <button 
            onClick={fetchAllOrders}
            className="self-end px-4 py-2 text-indigo-800 transition duration-500 bg-transparent border border-indigo-800 rounded hover:bg-indigo-600 hover:text-white"
          >
            Apply
          </button>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Analysis Level</label>
          <select
            value={analysisLevel}
            onChange={(e) => setAnalysisLevel(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
          </select>
        </div>
      </div>

      {/* Export & Import Section */}
      <div className="flex flex-wrap justify-center gap-3 p-4 mb-6 bg-white rounded-lg shadow-md md:justify-between">
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-black transition duration-500"
          >
            📄 Export to PDF
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-black transition duration-500"
          >
            📊 Export to Excel
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-black transition duration-500"
          >
            🗃 Export to CSV
          </button>
        </div>
        <label className={`px-4 py-2 md:px-5 md:py-2.5 ${csvUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'} text-gray-700 rounded-lg shadow cursor-pointer transition`}>
          {csvUploading ? '⏳ Uploading...' : '📥 Import Excel'}
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            onChange={importFromExcel} 
            disabled={csvUploading}
          />
        </label>
      </div>

      {/* Enhanced Summary Grid */}
      <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 text-center bg-gray-100 border rounded-lg shadow-lg">
          <h4 className="mb-2 text-lg font-semibold md:text-xl">Total Sales</h4>
          <p className="text-xl md:text-2xl">{currency}{formatNumber(analytics.totalSales)}</p>
        </div>
        {/* shipping fee */}
        {/* <div className="p-6 text-center bg-gray-100 border rounded-lg shadow-lg">
          <h4 className="mb-2 text-lg font-semibold md:text-xl">Total Shipping Fee</h4>
          <p className="text-xl md:text-2xl">{currency}{formatNumber(analytics.totalSales - analytics.totalAdditionalCapital - analytics.totalCapital - analytics.totalVAT + analytics.totalVariationAdjustment )}</p>
        </div> */}

        <div className="p-6 text-center bg-gray-100 border rounded-lg shadow-lg">
          <h4 className="mb-2 text-lg font-semibold md:text-xl">Total Capital</h4>
          <p className="text-xl md:text-2xl">{currency}{formatNumber(analytics.totalCombinedCapital)}</p>
          {/* <p className="mt-1 text-sm text-gray-600">
            (Base: {currency}{formatNumber(analytics.totalCapital)})
          </p>
          <p className="text-sm text-gray-600">
            (Additional: {currency}{formatNumber(analytics.totalAdditionalCapital)})
          </p> */}
        </div>
        <div className="p-6 text-center bg-gray-100 border rounded-lg shadow-lg">
          <h4 className="mb-2 text-lg font-semibold md:text-xl">Total Profit</h4>
          <p className="text-xl md:text-2xl">{currency}{formatNumber(analytics.totalProfit)}</p>
          {/*<p className="mt-1 text-sm text-gray-600">
            {analytics.totalSales > 0 ? 
              `${(analytics.totalProfit / analytics.totalSales * 100).toFixed(2)}% margin` : 
              '0% margin'}
          </p>*/}
        </div>
        <div className="p-6 text-center bg-gray-100 border rounded-lg shadow-lg">
          <h4 className="mb-2 text-lg font-semibold md:text-xl">Total Orders</h4>
          <p className="text-xl md:text-2xl">{formatNumber(analytics.totalOrders)}</p>
          <p className="mt-1 text-sm text-gray-600">
            {formatNumber(analytics.customerMetrics.newCustomers)} new customers
          </p>
          <p className="text-sm text-gray-600">
            {formatNumber(analytics.customerMetrics.repeatCustomers)} repeat customers
          </p>
        </div>
        <div className="p-6 text-center bg-gray-100 border rounded-lg shadow-lg">
          <h4 className="mb-2 text-lg font-semibold md:text-xl">Total VAT</h4>
          <p className="text-xl md:text-2xl">{currency}{formatNumber(analytics.totalVAT)}</p>
         {/* <p className="mt-1 text-sm text-gray-600">
            {analytics.vatPercentage.toFixed(2)}% of sales
          </p>*/}
        </div>
        <div className="p-6 text-center bg-gray-100 border rounded-lg shadow-lg">
          <h4 className="mb-2 text-lg font-semibold md:text-xl">Low Stock Items</h4>
          <p className="text-xl md:text-2xl">{analytics.lowStockProducts.length}</p>
          <p className="mt-1 text-sm text-gray-600">
            {
              analytics.lowStockProducts.filter(p => {
                let qty = 0;
                if (p.variations?.length) {
                  qty = p.variations.reduce((sum, v) => {
                    return sum + (v.options?.reduce((s, o) => s + (o.quantity || 0), 0) || 0);
                  }, 0);
                } else {
                  qty = p.quantity || 0;
                }
                return qty < 5;
              }).length
            } critical
          </p>

        </div>
      </div>

      {/* Capital Breakdown Section */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-lg">
        <h4 className="mb-4 text-lg font-semibold text-center md:text-xl">Capital Breakdown</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="p-4 text-center border rounded">
            <h5 className="font-medium">Base Capital</h5>
            <p>{currency}{formatNumber(analytics.totalCapital)}</p>
            <p className="text-sm text-gray-500">
              {analytics.totalSales > 0 ? 
                `${((analytics.totalCapital / analytics.totalSales) * 100).toFixed(2)}% of sales` 
                : 'N/A'}
            </p>
          </div>
          <div className="p-4 text-center border rounded">
            <h5 className="font-medium">Margin</h5>
            <p>{currency}{formatNumber(analytics.totalAdditionalCapital + analytics.totalVariationAdjustment)}</p>
            <p className="text-sm text-gray-500">
              {analytics.totalSales > 0 ? 
                `${((analytics.totalAdditionalCapital / analytics.totalSales) * 100).toFixed(2)}% of sales` 
                : 'N/A'}
            </p>
          </div>
        
          
          {/* <div className="p-4 text-center border rounded">
            <h5 className="font-medium">Total Capital</h5>
            <p>{currency}{formatNumber(analytics.totalCombinedCapital)}</p>
            <p className="text-sm text-gray-500">
              {analytics.totalSales > 0 ? 
                `${((analytics.totalCombinedCapital / analytics.totalSales) * 100).toFixed(2)}% of sales` 
                : 'N/A'}
            </p>
          </div> */}
        </div>
      </div>

      {/* Low Stock Products Section */}
      {analytics.lowStockProducts.length > 0 && (
        <div className="p-4 mb-6 bg-white rounded-lg shadow-lg">
          <h4 className="mb-4 text-lg font-semibold text-center md:text-xl">Low Stock Products</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Product Name</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Remaining Quantity</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.lowStockProducts
                  .sort((a, b) => {
                    const aQty = a.variations?.reduce((sum, v) => sum + v.options?.reduce((s, o) => s + (o.quantity || 0), 0), 0) || a.quantity || 0;
                    const bQty = b.variations?.reduce((sum, v) => sum + v.options?.reduce((s, o) => s + (o.quantity || 0), 0), 0) || b.quantity || 0;
                    return aQty - bQty;
                  })
                  .slice(0, 10)
                  .map((product) => {
                    const totalQuantity = product.variations?.reduce((sum, variation) => {
                      return sum + variation.options?.reduce((optSum, option) => {
                        return optSum + (option.quantity || 0);
                      }, 0);
                    }, 0) || product.quantity || 0;
                    const status = totalQuantity < 5 ? 'Critical' : 'Low';
                    
                    return (
                      <tr key={product._id || Math.random()}>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {formatNumber(totalQuantity)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
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
          {analytics.lowStockProducts.length > 10 && (
            <div className="mt-2 text-sm text-center text-gray-500">
              Showing 10 of {formatNumber(analytics.lowStockProducts.length)} low stock products
            </div>
          )}
        </div>
      )}

      {/* Order Details Table */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-lg">
        <h4 className="mb-4 text-lg font-semibold text-center md:text-xl">Order Details</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Products</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Sales</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Capital</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Profit</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">VAT</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.slice(0, 5).map((order) => {
                const orderCapital = order.items?.reduce?.((sum, item) => 
                  sum + (item.capital || 0) * (item.quantity || 0), 0) || 0;
                const orderAdditionalCapital = order.items?.reduce?.((sum, item) => 
                  sum + (item.additionalCapital || 0) * (item.quantity || 0), 0) || 0;
                const orderCombinedCapital = orderCapital + orderAdditionalCapital;
                const orderProfit = (order.amount || 0) - orderCombinedCapital;
                const orderVAT = order.items?.reduce?.((sum, item) => {
                  const itemPrice = item.price || 0;
                  const itemVATRate = (item.vat || 0) / 100;
                  const quantity = item.quantity || 0;
                  return sum + (itemPrice * quantity * itemVATRate);
                }, 0) || 0;
                
                return (
                  <tr key={order._id || Math.random()}>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{order._id?.slice(-6) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{order.userId || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.items?.map?.(item => item.name).join(", ") || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{currency}{formatNumber(order.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{currency}{formatNumber(orderCombinedCapital)}</div>
                      <div className="text-xs text-gray-400">
                        (Base: {currency}{formatNumber(orderCapital)})
                      </div>
                      <div className="text-xs text-gray-400">
                        (Additional: {currency}{formatNumber(orderAdditionalCapital)})
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {currency}{formatNumber(orderProfit)}
                      <div className="text-xs text-gray-400">
                        {order.amount > 0 ? `${(orderProfit / order.amount * 100).toFixed(2)}%` : '0%'} margin
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {currency}{formatNumber(orderVAT)} 
                      <div className="text-xs text-gray-400">
                        {order.amount > 0 ? `${(orderVAT / order.amount * 100).toFixed(2)}%` : '0%'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.status || 'Unknown'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length > 5 && (
          <div className="mt-2 text-sm text-center text-gray-500">
            Showing 5 of {formatNumber(orders.length)} orders
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        <div className="p-4 bg-white rounded-lg shadow-lg">
          <h4 className="mb-4 text-lg font-semibold text-center md:text-xl">Sales Trend ({analysisLevel})</h4>
          <canvas id="timeAnalysisChart" className="w-full aspect-[4/3]"></canvas>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-lg">
          <h4 className="mb-4 text-lg font-semibold text-center md:text-xl">Order Status</h4>
          <canvas id="statusChart" className="w-full aspect-[4/3]"></canvas>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 bg-white rounded-lg shadow-lg">
          <h4 className="mb-4 text-lg font-semibold text-center md:text-xl">Top Products</h4>
          <canvas id="productsChart" className="w-full aspect-[3/1]"></canvas>
        </div>
        {analytics.lowStockProducts.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow-lg">
            <h4 className="mb-4 text-lg font-semibold text-center md:text-xl">Low Stock Products</h4>
            <canvas id="stockChart" className="w-full aspect-[3/1]"></canvas>
          </div>
        )}
      </div>

      <ViewersTracker />
      <Review />
    </div>
  );
};

export default OrderAnalytics;