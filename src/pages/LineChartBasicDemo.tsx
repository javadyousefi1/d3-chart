import { useState } from "react";
// components
import LineChart from "../components/LineChart";
// Sample data
import { thirdData, firstData, secondData } from "../data/data";
// antd
import { Select } from "antd";

const dataList = [
    { label: "first data", value: 1, data: firstData },
    { label: "second data", value: 2, data: secondData },
    { label: "third data", value: 3, data: thirdData },
]

type DataType = {
    x: number,
    y: number,
}

export const LineChartBasicDemo = () => {

    const [data, setData] = useState<DataType[] | []>([])


    const handleChangeData = (id: number) => {
        const relatedData = dataList.find(item => item.value === id)?.data!
        setData(relatedData)
    }


    return (
        <div>
            {/* chart */}
            <div className="p-10 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                <LineChart data={data} width={700} height={700} label={"x"} value={"y"} />
            </div>
            {/* data selector */}
            <div className="flex flex-col items-center justify-center mt-10 gap-y-3">
                <p>Please select your data :</p>
                <Select options={dataList} className="w-[200px]" onChange={handleChangeData} />
            </div>
        </div>
    )
};
