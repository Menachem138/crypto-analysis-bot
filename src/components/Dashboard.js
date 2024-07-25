import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, VStack, Heading, FormControl, FormLabel, Input, Button,
  Table, Thead, Tbody, Tr, Th, Td, Stat, StatLabel, StatNumber, StatGroup,
  SimpleGrid, Select, Image, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { DragHandleIcon } from '@chakra-ui/icons';
import api from '../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, zoomPlugin);

const Dashboard = () => {
  const userId = 'test-user-id'; // Temporary hardcoded userId for testing
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', date: '', category: '' });
  const [expenseDistribution, setExpenseDistribution] = useState(null);
  const [expenseTrends, setExpenseTrends] = useState(null);
  const [expenseComparison, setExpenseComparison] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [visualizationDataFetched, setVisualizationDataFetched] = useState(false);
  const [layout, setLayout] = useState(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    return savedLayout ? JSON.parse(savedLayout) : ['summary', 'expenseDistribution', 'expenseTrends', 'expenseComparison'];
  });

  const fetchVisualizationData = useCallback(async () => {
    try {
      console.log('Fetching visualization data for user:', userId);
      const data = await api.getVisualizations(userId);
      console.log('Raw visualization data received:', data);

      if (data?.expenseDistribution) {
        setExpenseDistribution(data.expenseDistribution);
        console.log('Expense Distribution set:', data.expenseDistribution);
      } else {
        console.warn('Expense Distribution data is missing or invalid');
      }

      if (data?.expenseTrends) {
        setExpenseTrends(data.expenseTrends);
        console.log('Expense Trends set:', data.expenseTrends);
      } else {
        console.warn('Expense Trends data is missing or invalid');
      }

      if (data?.expenseComparison) {
        setExpenseComparison(data.expenseComparison);
        console.log('Expense Comparison set:', data.expenseComparison);
      } else {
        console.warn('Expense Comparison data is missing or invalid');
      }

      if (data?.dashboardSummary) {
        setDashboardSummary(data.dashboardSummary);
        console.log('Dashboard Summary set:', data.dashboardSummary);
      } else {
        console.warn('Dashboard Summary data is missing or invalid');
      }

      setVisualizationDataFetched(true);
    } catch (error) {
      console.error('Error fetching visualization data:', error);
      setVisualizationDataFetched(false);
    }
  }, [userId]);

  useEffect(() => {
    console.log('Expenses state:', expenses);
    console.log('Fetching visualization data...');
    fetchVisualizationData();
  }, [fetchVisualizationData]);

  useEffect(() => {
    console.log('Visualization data updated:');
    console.log('- Expense Distribution:', expenseDistribution);
    console.log('- Expense Trends:', expenseTrends);
    console.log('- Expense Comparison:', expenseComparison);
    console.log('- Dashboard Summary:', dashboardSummary);
  }, [expenseDistribution, expenseTrends, expenseComparison, dashboardSummary]);

  const updateLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
  };

  const addOrUpdateExpense = async (e) => {
    e.preventDefault();
    if (newExpense.id) {
      // Editing existing expense
      try {
        await api.updateExpense(newExpense.id, newExpense);
        const updatedExpenses = await api.getAllExpensesForUser(userId);
        setExpenses(updatedExpenses);
        await fetchVisualizationData(); // Add this line
      } catch (error) {
        console.error('Error updating expense:', error);
      }
    } else {
      // Adding new expense
      try {
        await api.addExpense({ ...newExpense, userId });
        const updatedExpenses = await api.getAllExpensesForUser(userId);
        setExpenses(updatedExpenses);
        await fetchVisualizationData(); // Add this line
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    }
    setNewExpense({ name: '', amount: '', date: '', category: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  const handleEditExpense = (expense) => {
    setNewExpense(expense);
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.deleteExpense(id);
      setExpenses(expenses.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0).toFixed(2);
  };

  const calculateAverageExpense = () => {
    return expenses.length > 0 ? (calculateTotalExpenses() / expenses.length).toFixed(2) : '0.00';
  };

  const getHighestExpenseCategory = () => {
    const categoryTotals = expenses.reduce((totals, expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + parseFloat(expense.amount);
      return totals;
    }, {});
    return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  };

  return (
    <Box p={4} bg="gray.50">
      <VStack spacing={6} align="stretch">
        <Heading mb={6} pb={3} borderBottom="2px" borderColor="blue.200">Financial Dashboard</Heading>

        <Box as="form" onSubmit={addOrUpdateExpense} bg="white" p={6} borderRadius="md" boxShadow="sm">
          <SimpleGrid columns={[1, null, 2]} spacing={6}>
            <FormControl isRequired>
              <FormLabel>Expense Name</FormLabel>
              <Input name="name" value={newExpense.name} onChange={handleInputChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Amount</FormLabel>
              <Input name="amount" type="number" value={newExpense.amount} onChange={handleInputChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Date</FormLabel>
              <Input name="date" type="date" value={newExpense.date} onChange={handleInputChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select name="category" value={newExpense.category} onChange={handleInputChange}>
                <option value="">Select category</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Tools">Tools</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </Select>
            </FormControl>
          </SimpleGrid>
          <Button mt={6} colorScheme="blue" type="submit" width="full">
            {newExpense.id ? 'Update Expense' : 'Add Expense'}
          </Button>
        </Box>

        <StatGroup bg="white" p={6} borderRadius="md" boxShadow="sm">
          <Stat>
            <StatLabel>Total Expenses</StatLabel>
            <StatNumber>${calculateTotalExpenses()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Average Expense</StatLabel>
            <StatNumber>${calculateAverageExpense()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Highest Expense Category</StatLabel>
            <StatNumber>{getHighestExpenseCategory()}</StatNumber>
          </Stat>
        </StatGroup>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          {layout?.map((item) => (
            <Box key={item} position="relative" bg="white" p={6} borderRadius="md" boxShadow="sm">
              <Menu>
                <MenuButton as={Button} size="sm" position="absolute" top={2} right={2}>
                  <DragHandleIcon />
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => {
                    const newLayout = layout.filter(i => i !== item);
                    updateLayout(newLayout);
                  }}>Remove</MenuItem>
                </MenuList>
              </Menu>
              {item === 'summary' && (
                <Box>
                  <Heading size="md" mb={4}>Summary</Heading>
                  <StatGroup>
                    <Stat>
                      <StatLabel>Total Expenses</StatLabel>
                      <StatNumber>${calculateTotalExpenses()}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Average Expense</StatLabel>
                      <StatNumber>${calculateAverageExpense()}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Highest Expense Category</StatLabel>
                      <StatNumber>{getHighestExpenseCategory()}</StatNumber>
                    </Stat>
                  </StatGroup>
                </Box>
              )}
              {item === 'expenseDistribution' && (
                <Box>
                  <Heading size="md" mb={4}>Expense Distribution</Heading>
                  {console.log('Rendering Expense Distribution:', expenseDistribution)}
                  {expenseDistribution?.data ? (
                    <Pie
                      data={expenseDistribution.data}
                      options={{
                        plugins: {
                          legend: {
                            position: 'bottom',
                            onClick: (event, legendItem, legend) => {
                              const index = legendItem.index;
                              const ci = legend.chart;
                              ci.toggleDataVisibility(index);
                              ci.update();
                            }
                          }
                        }
                      }}
                    />
                  ) : visualizationDataFetched ? (
                    <Box textAlign="center" py={4}>No data available for expense distribution</Box>
                  ) : (
                    <Box textAlign="center" py={4}>Loading expense distribution data...</Box>
                  )}
                </Box>
              )}
              {item === 'expenseTrends' && (
                <Box>
                  <Heading size="md" mb={4}>Expense Trends</Heading>
                  {console.log('Rendering Expense Trends:', expenseTrends)}
                  {expenseTrends?.data ? (
                    <Line
                      data={expenseTrends.data}
                      options={{
                        plugins: {
                          zoom: {
                            zoom: {
                              wheel: { enabled: true },
                              pinch: { enabled: true },
                              mode: 'xy',
                            },
                            pan: { enabled: true, mode: 'xy' },
                          },
                          legend: {
                            position: 'bottom'
                          }
                        },
                        scales: {
                          x: {
                            type: 'time',
                            time: {
                              unit: 'day'
                            }
                          }
                        }
                      }}
                    />
                  ) : visualizationDataFetched ? (
                    <Box textAlign="center" py={4}>No data available for expense trends</Box>
                  ) : (
                    <Box textAlign="center" py={4}>Loading expense trends data...</Box>
                  )}
                </Box>
              )}
              {item === 'expenseComparison' && (
                <Box>
                  <Heading size="md" mb={4}>Expense Comparison</Heading>
                  {console.log('Rendering Expense Comparison:', expenseComparison)}
                  {expenseComparison?.data ? (
                    <Bar
                      data={expenseComparison.data}
                      options={{
                        plugins: {
                          zoom: {
                            zoom: {
                              wheel: { enabled: true },
                              pinch: { enabled: true },
                              mode: 'y',
                            },
                            pan: { enabled: true, mode: 'y' },
                          },
                          legend: {
                            position: 'bottom'
                          }
                        },
                      }}
                    />
                  ) : visualizationDataFetched ? (
                    <Box textAlign="center" py={4}>No data available for expense comparison</Box>
                  ) : (
                    <Box textAlign="center" py={4}>Loading expense comparison data...</Box>
                  )}
                </Box>
              )}
              {item === 'dashboardSummary' && (
                <Box>
                  <Heading size="md" mb={4}>Dashboard Summary</Heading>
                  {dashboardSummary ? (
                    <Image src={`data:image/png;base64,${dashboardSummary}`} alt="Dashboard Summary" />
                  ) : visualizationDataFetched ? (
                    <Box textAlign="center" py={4}>No data available for dashboard summary</Box>
                  ) : (
                    <Box textAlign="center" py={4}>Loading dashboard summary...</Box>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </SimpleGrid>

        <Button onClick={() => updateLayout(['summary', 'expenseDistribution', 'expenseTrends', 'expenseComparison', 'dashboardSummary'])}>
          Reset Layout
        </Button>

        <Box overflowX="auto" bg="white" p={6} borderRadius="md" boxShadow="sm">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Name</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {expenses.map((expense) => (
                <Tr key={expense.id}>
                  <Td>{expense.name}</Td>
                  <Td>${parseFloat(expense.amount).toFixed(2)}</Td>
                  <Td>{expense.date}</Td>
                  <Td>{expense.category}</Td>
                  <Td>
                    <Button size="sm" colorScheme="blue" onClick={() => handleEditExpense(expense)} mr={2}>Edit</Button>
                    <Button size="sm" colorScheme="red" onClick={() => handleDeleteExpense(expense.id)}>Delete</Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
};

export default Dashboard;